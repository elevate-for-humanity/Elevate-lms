import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ guard: vi.fn(), db: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/auth/require-role', () => ({ requireRole: mocks.guard }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(url); } }));
import { approveSocialPost, enableApprovedPublishing } from '@/apps/admin/app/social-media/actions';

describe('existing social queue approval wiring', () => {
  const version = '2026-10-08T15:00:00Z';
  let account: Record<string, unknown>;
  let post: Record<string, unknown>;
  let writes: Array<{ table: string; data: Record<string, unknown> }>;
  beforeEach(() => {
    vi.clearAllMocks();
    writes = [];
    account = { enabled: true, connection_status: 'verified_read_only', organization_id: 'page',
      granted_scopes: ['pages_manage_posts'], dry_run: false, updated_at: version };
    post = { id: 'post', platform: 'facebook', destination_type: 'facebook_page', source_id: 'blog', updated_at: version };
    mocks.guard.mockResolvedValue({ user: { id: 'admin-123' } });
    mocks.db.mockResolvedValue({ from: (table: string) => {
      let updating = false;
      const chain: any = {
        select: () => chain, eq: () => chain, in: () => chain,
        single: async () => ({ data: table === 'social_media_settings' ? account : table === 'social_media_posts' ? post : { id: 'blog' }, error: null }),
        update: (data: Record<string, unknown>) => { updating = true; writes.push({ table, data }); return chain; },
        then: (resolve: (value: unknown) => unknown) => resolve({ data: updating ? [{ id: 'updated' }] : [], error: null }),
      };
      return chain;
    } });
  });
  function approval() {
    const form = new FormData();
    form.set('id', 'post'); form.set('updated_at', version);
    form.set('caption', 'Reviewed factual caption with the approved website link.');
    return form;
  }
  it('queues the reviewed caption with the authenticated approver', async () => {
    await approveSocialPost(approval());
    expect(mocks.guard).toHaveBeenCalledWith(['admin', 'super_admin']);
    expect(writes).toHaveLength(1);
    expect(writes[0].data).toMatchObject({ status: 'queued', approval_state: 'approved', approved_by: 'admin-123', caption: 'Reviewed factual caption with the approved website link.' });
  });
  it('does not queue posts against a read-only account', async () => {
    account.dry_run = true;
    await expect(approveSocialPost(approval())).rejects.toThrow('Enable%20approved%20publishing');
    expect(writes).toHaveLength(0);
  });
  it('requires renewed review when a post changed', async () => {
    post.updated_at = '2026-10-08T16:00:00Z';
    await expect(approveSocialPost(approval())).rejects.toThrow('post%20changed');
    expect(writes).toHaveLength(0);
  });
  it('does not turn on publication without the provider permission', async () => {
    account.granted_scopes = ['pages_read_engagement'];
    const form = new FormData(); form.set('platform', 'facebook');
    await expect(enableApprovedPublishing(form)).rejects.toThrow('publishing%20permissions');
    expect(writes).toHaveLength(0);
  });
});
