// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'owner' } } }) },
    from: () => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => ({ error: null, data: { id: 'return', filing_status: 'single' } }),
        insert: (v: unknown) => {
          state.insert(v);
          return q;
        },
        single: async () => ({ data: { id: 'w2' }, error: null }),
        then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
      };
      return q;
    },
  }),
}));
import { POST } from '@/apps/marketing/app/api/tax/w2/confirm/route';
const request = (extra = {}) =>
  new NextRequest('https://www.elevateforhumanity.org/api/tax/w2/confirm', {
    method: 'POST',
    body: JSON.stringify({
      returnId: 'return',
      employerEin: '12-3456789',
      employerName: 'Test employer',
      wages: '50000',
      ...extra,
    }),
  });
beforeEach(() => state.insert.mockClear());
describe('confirmed W-2 amount semantics', () => {
  it('preserves an omitted optional box as null and an explicit zero as zero', async () => {
    const response = await POST(request({ socialSecurityWages: '', medicareWages: '0' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(state.insert).toHaveBeenCalledWith(
      expect.objectContaining({ social_security_wages: null, medicare_wages: 0 }),
    );
  });
  it('rejects boolean amounts instead of coercing them into dollars', async () => {
    const response = await POST(request({ wages: true }));
    expect(response.status).toBe(400);
    expect(state.insert).not.toHaveBeenCalled();
  });
});
