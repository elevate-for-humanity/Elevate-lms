import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// These are route-level regressions, not mocks of the access helper. The
// selected approved partner must be applied by the route before any data is
// returned to a Host Shop admin preview.
const fixture = vi.hoisted(() => ({
  selected: 'partner-a' as string | undefined,
  profileState: 'active' as 'active' | 'inactive' | 'suspended' | 'missing',
  profileError: false,
  filters: [] as unknown[][],
  matchQueryExecuted: false,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => fixture.selected ? { value: fixture.selected } : undefined,
  }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'admin' } } }) },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      const q: any = {};
      for (const method of ['select', 'eq', 'neq', 'is', 'order', 'range', 'in']) {
        q[method] = (...args: unknown[]) => {
          fixture.filters.push([table, method, ...args]);
          return q;
        };
      }
      const result = () => ({
        data: table === 'profiles'
          ? fixture.profileState === 'missing' ? null : {
            role: 'admin',
            is_active: fixture.profileState !== 'inactive',
            suspended: fixture.profileState === 'suspended',
          }
          : table === 'shops' ? [{ id: 'shop-a' }] : [],
        error: table === 'profiles' && fixture.profileError
          ? new Error('profile read failed') : null,
        count: 0,
      });
      q.maybeSingle = async () => result();
      q.then = (resolve: (value: unknown) => void) => {
        if (table === 'host_shop_match_requests') fixture.matchQueryExecuted = true;
        return Promise.resolve(result()).then(resolve);
      };
      return q;
    },
  }),
}));
import { GET, POST } from '@/apps/lms/app/api/host-shop/match-requests/route';
import {
  GET as getMatchDetail, PATCH as patchMatchDetail,
} from '@/apps/lms/app/api/host-shop/match-requests/[id]/route';

describe('Host Shop matching admin preview boundary', () => {
  beforeEach(() => {
    fixture.selected = 'partner-a';
    fixture.profileState = 'active';
    fixture.profileError = false;
    fixture.filters = [];
    fixture.matchQueryExecuted = false;
  });

  it('scopes previews to the explicitly selected approved partner and its shops', async () => {
    const r = await GET(new NextRequest(
      'https://app.elevateforhumanity.org/api/host-shop/match-requests?status=all',
    ));
    expect(r.status).toBe(200);
    // Partner lookups now use a bounded list (to support approved multi-shop
    // memberships), not the stale pre-repair single-partner .eq() expectation.
    expect(fixture.filters).toContainEqual(['shops', 'in', 'partner_id', ['partner-a']]);
    expect(fixture.filters).toContainEqual([
      'host_shop_match_requests', 'in', 'host_shop_id', ['shop-a'],
    ]);
    expect(fixture.filters).not.toContainEqual([
      'host_shop_match_requests', 'eq', 'apprentice_id', 'shop-owner',
    ]);
    expect(fixture.filters).not.toContainEqual([
      'host_shop_match_requests', 'eq', 'status', 'all',
    ]);
    expect(fixture.matchQueryExecuted).toBe(true);
  });

  it('returns an empty preview and never executes the match query without a selected partner', async () => {
    fixture.selected = undefined;
    const r = await GET(new NextRequest(
      'https://app.elevateforhumanity.org/api/host-shop/match-requests',
    ));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toEqual({
      requests: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 },
    });
    expect(fixture.filters).not.toContainEqual([
      'host_shop_match_requests', 'in', 'host_shop_id', ['shop-a'],
    ]);
    expect(fixture.matchQueryExecuted).toBe(false);
  });

  it.each(['inactive', 'suspended', 'missing'] as const)(
    'fails closed for %s accounts on list, create, detail and mutation routes',
    async (profileState) => {
      fixture.profileState = profileState;
      const list = await GET(new NextRequest(
        'https://app.elevateforhumanity.org/api/host-shop/match-requests',
      ));
      const create = await POST(new NextRequest(
        'https://app.elevateforhumanity.org/api/host-shop/match-requests',
        { method: 'POST', body: JSON.stringify({ host_shop_id: 'shop-a', program_slug: 'barber-apprenticeship' }) },
      ));
      const details = await getMatchDetail(new NextRequest(
        'https://app.elevateforhumanity.org/api/host-shop/match-requests/match-a',
      ), { params: Promise.resolve({ id: 'match-a' }) });
      const patch = await patchMatchDetail(new NextRequest(
        'https://app.elevateforhumanity.org/api/host-shop/match-requests/match-a',
        { method: 'PATCH', body: JSON.stringify({ status: 'approved' }) },
      ), { params: Promise.resolve({ id: 'match-a' }) });
      expect([list.status, create.status, details.status, patch.status]).toEqual([401, 401, 401, 401]);
      expect(fixture.matchQueryExecuted).toBe(false);
      expect(fixture.filters.every(([table]) => table === 'profiles')).toBe(true);
    },
  );

  it('fails closed on a database profile read failure, before privileged student queries', async () => {
    fixture.profileError = true;
    await expect(GET(new NextRequest(
      'https://app.elevateforhumanity.org/api/host-shop/match-requests',
    ))).rejects.toThrow('HOST_SHOP_PROFILE_LOOKUP_FAILED');
    expect(fixture.matchQueryExecuted).toBe(false);
  });

});
