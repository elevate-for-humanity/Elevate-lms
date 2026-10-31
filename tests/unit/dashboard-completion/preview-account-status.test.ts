// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@/lib/supabase';
const state = vi.hoisted(() => ({ flags: { is_active: true, suspended: false } }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'signed-handoff' }) }),
}));
vi.mock('@/lib/admin/portal-preview-handoff', () => ({
  verifyPortalPreviewHandoff: () => ({ actorId: 'admin', targetId: 'target' }),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => db }));
const db = {
  from: (table: string) => {
    let id = '';
    const q = {
      select: () => q,
      eq: (_key: string, value: string) => {
        id = value;
        return q;
      },
      maybeSingle: async () => ({
        data:
          table === 'partners'
            ? { id: 'target', status: 'active', approval_status: 'approved', is_active: true }
            : id === 'admin'
              ? { id, role: 'admin', ...state.flags }
              : { id, role: 'student' },
        error: null,
      }),
    };
    return q;
  },
};
import { resolveCoursePreview } from '@/lib/admin/course-preview';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveHostShopAdminPreview } from '@/lib/admin/host-shop-preview';
beforeEach(() => {
  state.flags = { is_active: true, suspended: false };
});
it.each([
  { is_active: false, suspended: false },
  { is_active: true, suspended: true },
])('revokes old signed preview authority for disabled actor %j', async (flags) => {
  state.flags = flags;
  expect((await resolveCoursePreview('target')).active).toBe(false);
  expect(
    (await resolvePortalPreviewSubject(db as unknown as SupabaseClient, null)).previewing,
  ).toBe(false);
  expect(await resolveHostShopAdminPreview()).toBeNull();
});
it('preserves read-only previews for the active authorized administrator', async () => {
  expect((await resolveCoursePreview('target')).active).toBe(true);
  expect(await resolvePortalPreviewSubject(db as unknown as SupabaseClient, null)).toEqual({
    userId: 'target',
    previewing: true,
  });
  expect(await resolveHostShopAdminPreview()).toMatchObject({
    actorId: 'admin',
    partnerId: 'target',
  });
});
