import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const state = vi.hoisted(() => ({
  roles: ['admin'],
  allowed: true,
  level: 'aal2',
  assuranceError: null as null | { message: string },
  failedTable: '',
  tables: [] as string[],
  assuranceReads: 0,
}));
vi.mock('@/lib/auth/require-role', () => ({
  requireRole: async () => {
    if (!state.allowed) throw new Error('unauthorized');
    return { effectiveRoles: state.roles };
  },
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { mfa: { getAuthenticatorAssuranceLevel: async () => {
      state.assuranceReads += 1;
      return { data: { currentLevel: state.level, nextLevel: 'aal2' }, error: state.assuranceError };
    } } },
    from: (table: string) => {
      state.tables.push(table);
      const result = {
        data: state.failedTable === table ? null : [{ id: table, title: 'Approved source', slug: 'approved-source' }],
        error: state.failedTable === table ? { message: 'private backend diagnostic' } : null,
      };
      const query = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
      };
      return query;
    },
  }),
}));
vi.mock('@/apps/admin/app/social-media/campaigns/new/NewSocialCampaignClient', () => ({
  default: ({ programs, blogs }: { programs: unknown[]; blogs: unknown[] }) => (
    <p>Editor: {programs.length} programs and {blogs.length} articles</p>
  ),
}));
import Page from '@/apps/admin/app/social-media/campaigns/new/page';

beforeEach(() => {
  state.roles = ['admin']; state.allowed = true; state.level = 'aal2';
  state.assuranceError = null; state.failedTable = ''; state.tables = []; state.assuranceReads = 0;
});
const render = async () => renderToStaticMarkup(await Page());

describe('campaign source reads retain authenticated MFA and RLS', () => {
  it.each(['admin', 'super_admin'])('explains AAL1 %s denial before reading protected sources', async role => {
    state.roles = [role]; state.level = 'aal1';
    const html = await render();
    expect(html).toContain('Multi-factor verification is required');
    expect(html).toContain('/mfa?redirect=%2Fsocial-media%2Fcampaigns%2Fnew');
    expect(html).not.toContain('Editor:');
    expect(state.tables).toEqual([]);
  });
  it('loads real source results for an AAL2 administrator', async () => {
    expect(await render()).toContain('Editor: 1 programs and 1 articles');
    expect(state.tables).toEqual(['programs', 'blog_posts']);
  });
  it('does not impose administrator MFA on staff-only sessions', async () => {
    state.roles = ['staff']; state.level = 'aal1';
    expect(await render()).toContain('Editor: 1 programs and 1 articles');
    expect(state.assuranceReads).toBe(0);
  });
  it('applies MFA to a staff session that also has administrator membership', async () => {
    state.roles = ['staff', 'admin']; state.level = 'aal1';
    expect(await render()).toContain('Multi-factor verification is required');
    expect(state.tables).toEqual([]);
  });
  it('fails closed with recovery when assurance verification fails', async () => {
    state.assuranceError = { message: 'private backend diagnostic' };
    const html = await render();
    expect(html).toContain('authentication assurance could not be verified');
    expect(html).not.toContain('private backend diagnostic');
    expect(state.tables).toEqual([]);
  });
  it.each(['programs', 'blog_posts'])('reports %s read errors instead of an empty library', async table => {
    state.failedTable = table;
    const html = await render();
    expect(html).toContain('Campaign sources are unavailable');
    expect(html).toContain('Retry loading campaign sources');
    expect(html).not.toContain('Editor:');
    expect(html).not.toContain('private backend diagnostic');
  });
  it('does not reach database access when the role guard denies access', async () => {
    state.allowed = false;
    await expect(render()).rejects.toThrow('unauthorized');
    expect(state.tables).toEqual([]);
    expect(state.assuranceReads).toBe(0);
  });
});
