// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({
  saved: true,
  filters: [] as [string, unknown][],
  writes: [] as Record<string, unknown>[],
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from: (table: string) => {
      let writing = false;
      const q = {
        select: () => q,
        eq: (key: string, value: unknown) => {
          if (writing) state.filters.push([key, value]);
          return q;
        },
        update: (value: Record<string, unknown>) => {
          writing = true;
          state.writes.push(value);
          return q;
        },
        insert: async () => ({ error: null }),
        maybeSingle: async () => ({
          error: null,
          data:
            table !== 'tax_returns'
              ? null
              : writing
                ? state.saved
                  ? { id: 'return' }
                  : null
                : {
                    id: 'return',
                    tax_year: 2026,
                    filing_status: 'single',
                    updated_at: 'original-version',
                    return_json: { interview: { answers: { reviewed: true } } },
                  },
        }),
        then: (resolve: (v: unknown) => unknown) =>
          Promise.resolve({ error: null, data: [] }).then(resolve),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/marketing/app/api/tax/returns/calculate/route';
const request = () =>
  new NextRequest('https://www.elevateforhumanity.org/api/tax/returns/calculate', {
    method: 'POST',
    body: JSON.stringify({ returnId: 'return' }),
  });
beforeEach(() => {
  state.saved = true;
  state.filters = [];
  state.writes = [];
});
describe('calculation save concurrency', () => {
  it('retains the interview and requires the original return version', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toBe('Cookie');
    expect(state.filters).toContainEqual(['updated_at', 'original-version']);
    expect(state.writes[0].return_json).toMatchObject({
      interview: { answers: { reviewed: true } },
    });
  });
  it('reports a conflict instead of overwriting a return changed in another tab', async () => {
    state.saved = false;
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: expect.stringContaining('changed while calculating'),
    });
  });
});
