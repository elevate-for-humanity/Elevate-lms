// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  member: 'shop-user' as string | null,
  actor: 'admin' as string | null,
  rows: {
    admin: { id: 'admin', role: 'admin' },
    learner: { id: 'learner', role: 'student' },
    apprentice: { id: 'apprentice', role: 'apprentice' },
    holder: { id: 'holder', role: 'program_holder' },
  } as Record<string, any>,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.actor ? { id: state.actor } : null } }) },
  }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from(table: string) {
      let id = '';
      const query: any = {
        select: () => query,
        eq: (key: string, value: string) => {
          if (key === 'id') id = value;
          return query;
        },
        order: () => query,
        limit: () => query,
        maybeSingle: async () => ({
          data:
            table === 'profiles'
              ? state.rows[id]
              : table === 'partners'
                ? {
                    id: 'shop',
                    status: 'active',
                    is_active: true,
                    approval_status: 'approved',
                    partner_type: 'barber',
                  }
                : table === 'partner_users' && state.member
                  ? { user_id: state.member }
                  : null,
        }),
      };
      return query;
    },
  }),
}));
vi.mock('@/lib/admin/portal-preview-handoff', () => ({
  createPortalPreviewHandoff: (actorId: string, targetId: string) => `${actorId}:${targetId}`,
  verifyPortalPreviewHandoff: (token: string) => {
    const [actorId, targetId] = token.split(':');
    return actorId && targetId ? { actorId, targetId } : null;
  },
  readPortalPreviewHandoffTarget: () => null,
}));
vi.mock('@/lib/admin/guards', () => ({ apiRequireRoles: async () => ({ id: 'admin' }) }));
vi.mock('@/lib/partner/board', () => ({ HOST_SHOP_ADMIN_COOKIE: '__efh_host_shop_partner' }));
vi.mock('@/lib/admin/host-shop-preview', () => ({
  HOST_SHOP_PREVIEW_SESSION_COOKIE: 'elevate_host_shop_preview_session',
}));
import { GET, POST, DELETE } from '@/apps/lms/app/api/admin/preview/route';
import { POST as selectShop } from '@/apps/lms/app/api/admin/select-host-shop/route';

const userCookie = 'elevate_portal_preview_user';
const sessionCookie = 'elevate_portal_preview_session';
function request(query: string) {
  return new NextRequest(`https://lms.elevateforhumanity.org/api/admin/preview?${query}`, {
    headers: {
      cookie: `${userCookie}=old-user; ${sessionCookie}=admin:old-user; elevate_host_shop_preview_session=admin:old-shop; __efh_host_shop_partner=old-shop`,
    },
  });
}
beforeEach(() => {
  state.actor = 'admin';
  state.member = 'shop-user';
});

describe('switching signed portal previews', () => {
  it.each([
    ['learner', '/lms/dashboard'],
    ['apprentice', '/apprentice'],
    ['holder', '/program-holder/dashboard'],
  ])(
    'GET replaces both selector and signed session for %s and clears previous shop',
    async (target, path) => {
      const response = await GET(request(`user_id=${target}`));
      expect(response.status).toBe(303);
      expect(response.headers.get('location')).toBe(`https://lms.elevateforhumanity.org${path}`);
      expect(response.cookies.get(userCookie)?.value).toBe(target);
      expect(response.cookies.get(sessionCookie)?.value).toBe(`admin:${target}`);
      expect(response.cookies.get('elevate_portal_preview_actor')?.value).toBe('admin');
      expect(response.cookies.get('elevate_host_shop_preview_session')?.value).toBe('');
      expect(response.cookies.get('__efh_host_shop_partner')?.value).toBe('');
    },
  );
  it('POST also clears stale shop scope without changing the requested user', async () => {
    const response = await POST(
      new NextRequest('https://lms.elevateforhumanity.org/api/admin/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handoff: 'admin:apprentice' }),
      }),
    );
    expect(response.cookies.get(sessionCookie)?.value).toBe('admin:apprentice');
    expect(response.cookies.get('__efh_host_shop_partner')?.value).toBe('');
  });
  it('cannot select another user without an authenticated administrator on the legacy GET path', async () => {
    state.actor = null;
    const response = await GET(request('user_id=apprentice'));
    expect(response.headers.get('location')).toContain('/login?');
    expect(response.cookies.get(sessionCookie)).toBeUndefined();
  });
  it('rejects a non-admin actor on the authenticated GET path', async () => {
    state.actor = 'learner';
    const response = await GET(request('user_id=apprentice'));
    expect(response.headers.get('location')).toContain('/unauthorized');
    expect(response.cookies.get(sessionCookie)).toBeUndefined();
  });
  it('rejects a handoff whose actor is not an administrator', async () => {
    const response = await POST(
      new NextRequest('https://lms.elevateforhumanity.org/api/admin/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ handoff: 'learner:apprentice' }),
      }),
    );
    expect(response.status).toBe(403);
    expect(response.cookies.get(sessionCookie)).toBeUndefined();
  });
  it.each(['GET', 'DELETE'])(
    'ending by %s clears both user and shop preview identities',
    async (method) => {
      const response = method === 'GET' ? await GET(request('end=1')) : await DELETE();
      for (const name of [
        userCookie,
        sessionCookie,
        'elevate_portal_preview_actor',
        'elevate_host_shop_preview_session',
        '__efh_host_shop_partner',
      ]) {
        expect(response.cookies.get(name)?.value).toBe('');
        expect(response.cookies.get(name)?.expires?.getTime()).toBe(0);
      }
    },
  );
  it.each([null, 'new-shop-user'])(
    'selecting a shop replaces old user state when member is %s',
    async (member) => {
      state.member = member;
      const response = await selectShop(
        new NextRequest('https://lms.elevateforhumanity.org/api/admin/select-host-shop', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ handoff: 'admin:shop' }),
        }),
      );
      expect(response.status).toBe(303);
      expect(response.cookies.get('elevate_host_shop_preview_session')?.value).toBe('admin:shop');
      expect(response.cookies.get(userCookie)?.value).toBe(member || '');
      expect(response.cookies.get(sessionCookie)?.value).toBe(member ? `admin:${member}` : '');
    },
  );
});

it.each([
  ['/api/admin/preview', POST],
  ['/api/admin/select-host-shop', selectShop],
])('legacy %s preserves the POST body and sets no preview cookies before moving hosts', async (path, handler) => {
  const req = new NextRequest(`https://app.elevateforhumanity.org${path}`, {
    method: 'POST', body: 'handoff=admin%3Ashop',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });
  const response = await handler(req);
  expect(response.status).toBe(307);
  expect(response.headers.get('location')).toBe(`https://lms.elevateforhumanity.org${path}`);
  expect(response.cookies.getAll()).toHaveLength(0);
  expect(req.bodyUsed).toBe(false);
});
