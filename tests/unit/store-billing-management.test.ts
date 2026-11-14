import { beforeEach, it, expect, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const state = vi.hoisted(() => ({
  authenticated: true,
  found: true,
  failed: false,
  filters: [] as any[],
  updates: [] as any[],
}));
vi.mock('@/lib/admin/guards', () => ({
  apiRequireRoles: async () =>
    state.authenticated
      ? { id: 'owner' }
      : { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) },
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/store/customer-billing', () => ({ storeBillingKeys: async () => ['user:owner'] }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => {
      const q: any = {
        update: (value: any) => {
          state.updates.push(value);
          return q;
        },
        eq: (...v: any[]) => {
          state.filters.push(v);
          return q;
        },
        in: (...v: any[]) => {
          state.filters.push(v);
          return q;
        },
        select: () => q,
        maybeSingle: async () => ({
          data: state.found ? { id: 'schedule' } : null,
          error: state.failed ? { message: 'private detail' } : null,
        }),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/marketing/app/api/store/account/billing/route';
const scheduleId = '11111111-1111-4111-8111-111111111111';
const request = (id = scheduleId) =>
  new NextRequest('https://store.example.test/api/store/account/billing', {
    method: 'POST',
    body: JSON.stringify({ scheduleId: id }),
  });
beforeEach(() => {
  state.authenticated = true;
  state.found = true;
  state.failed = false;
  state.filters = [];
  state.updates = [];
});
it('requires a verified customer session', async () => {
  state.authenticated = false;
  expect((await POST(request())).status).toBe(401);
  expect(state.updates).toEqual([]);
});
it('rejects invalid schedule identifiers before querying billing', async () => {
  expect((await POST(request('------------------------------------'))).status).toBe(400);
  expect(state.updates).toEqual([]);
});
it('stops only owned manual QuickBooks Store schedules and keeps paid access intact', async () => {
  expect((await POST(request())).status).toBe(200);
  expect(state.filters).toContainEqual(['customer_external_key', ['user:owner']]);
  expect(state.filters).toContainEqual(['collection_mode', 'manual_invoice']);
  expect(state.filters).toContainEqual(['provider', 'quickbooks']);
  expect(state.updates[0].status).toBe('canceled');
  expect(state.updates[0]).not.toHaveProperty('current_period_end');
});
it('does not report success for a foreign or missing schedule', async () => {
  state.found = false;
  expect((await POST(request())).status).toBe(404);
});
it('reports an unavailable service without leaking database errors', async () => {
  state.failed = true;
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private detail');
});
