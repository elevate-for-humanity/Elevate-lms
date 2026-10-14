// @vitest-environment node
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  user: { id: '00000000-0000-4000-8000-000000000001' } as { id: string } | null,
  found: true,
  saved: true,
  invalidated: true,
  writes: [] as { table: string; data: Record<string, unknown> }[],
  filters: [] as [string, string, unknown][],
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: (table: string) => {
      let writing = false;
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          state.filters.push([table, key, value]);
          return q;
        },
        insert: (data: Record<string, unknown>) => {
          writing = true;
          state.writes.push({ table, data });
          return q;
        },
        update: (data: Record<string, unknown>) => {
          writing = true;
          state.writes.push({ table, data });
          return q;
        },
        delete: () => {
          writing = true;
          return q;
        },
        maybeSingle: async () => ({
          error: null,
          data:
            table === 'tax_returns'
              ? writing
                ? state.invalidated
                  ? { id: '00000000-0000-4000-8000-000000000010' }
                  : null
                : state.found
                  ? {
                      id: '00000000-0000-4000-8000-000000000010',
                      tax_year: 2026,
                      filing_status: 'single',
                      return_json: { calculation: { old: true } },
                      updated_at: '2026-10-14T02:00:00Z',
                    }
                  : null
              : state.saved
                ? { id: '00000000-0000-4000-8000-000000000020', updated_at: '2026-10-14T02:01:00Z' }
                : null,
        }),
        order: async () => ({ error: null, data: [] }),
      };
      return q;
    },
  }),
}));
import { POST, GET, DELETE } from '@/apps/marketing/app/api/tax/returns/business/route';
const rid = '00000000-0000-4000-8000-000000000010',
  bid = '00000000-0000-4000-8000-000000000020';
const business = {
  owner: 'primary',
  businessName: 'Test Consulting',
  principalActivity: 'CONSULTING',
  businessCode: '541990',
  accountingMethod: 'cash',
  materiallyParticipates: true,
  newBusiness: false,
  paymentsRequire1099: false,
  required1099Filed: false,
  allInvestmentAtRisk: true,
  grossReceipts: 10000,
  returnsAllowances: 0,
  otherIncome: 0,
  expenses: { office: 500 },
  otherExpenses: [],
  reviewed: true,
};
const req = (body: unknown, method = 'POST') =>
  new NextRequest('https://www.elevateforhumanity.org/api/tax/returns/business', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  state.user = { id: '00000000-0000-4000-8000-000000000001' };
  state.found = true;
  state.saved = true;
  state.invalidated = true;
  state.writes = [];
  state.filters = [];
});
describe('owned business records', () => {
  it('requires authentication before any business write', async () => {
    state.user = null;
    const r = await POST(req({ returnId: rid, business }));
    expect(r.status).toBe(401);
    expect(state.writes).toHaveLength(0);
    expect(r.headers.get('cache-control')).toContain('no-store');
  });
  it('does not disclose or write another user return', async () => {
    state.found = false;
    expect((await POST(req({ returnId: rid, business }))).status).toBe(404);
    expect(state.writes).toHaveLength(0);
    expect(state.filters).toContainEqual(['tax_returns', 'created_by_user_id', state.user!.id]);
  });
  it('derives saved profit and clears the old calculation', async () => {
    const r = await POST(req({ returnId: rid, business }));
    expect(r.status).toBe(200);
    const row = state.writes.find((w) => w.table === 'tax_schedule_c')!.data;
    expect(row.net_profit).toBe(9500);
    expect(row.tax_return_id).toBe(rid);
    expect(
      state.writes.find((w) => w.table === 'tax_returns')!.data.return_json,
    ).not.toHaveProperty('calculation');
  });
  it('rejects overposted totals or unreviewed inputs', async () => {
    expect(
      (await POST(req({ returnId: rid, business: { ...business, netProfit: 1 } }))).status,
    ).toBe(400);
    expect(
      (await POST(req({ returnId: rid, business: { ...business, reviewed: false } }))).status,
    ).toBe(400);
    expect(state.writes).toHaveLength(0);
  });
  it('requires a joint return for spouse business income', async () => {
    expect(
      (await POST(req({ returnId: rid, business: { ...business, owner: 'spouse' } }))).status,
    ).toBe(400);
    expect(state.writes).toHaveLength(0);
  });
  it('updates only the matching return and record version', async () => {
    state.saved = false;
    const r = await POST(
      req({ returnId: rid, businessId: bid, expectedUpdatedAt: '2026-10-14T02:00:00Z', business }),
    );
    expect(r.status).toBe(409);
    expect(state.filters).toContainEqual(['tax_schedule_c', 'tax_return_id', rid]);
    expect(state.filters).toContainEqual(['tax_schedule_c', 'updated_at', '2026-10-14T02:00:00Z']);
  });
  it('reports a saved business if concurrent return invalidation requires reload', async () => {
    state.invalidated = false;
    const r = await POST(req({ returnId: rid, business }));
    expect(r.status).toBe(409);
    expect((await r.json()).businessSaved).toBe(true);
  });
  it('checks ownership for reads and removals', async () => {
    state.found = false;
    expect(
      (
        await GET(
          new NextRequest(
            'https://www.elevateforhumanity.org/api/tax/returns/business?returnId=' + rid,
          ),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await DELETE(
          req(
            { returnId: rid, businessId: bid, expectedUpdatedAt: '2026-10-14T02:00:00Z' },
            'DELETE',
          ),
        )
      ).status,
    ).toBe(404);
  });
});
