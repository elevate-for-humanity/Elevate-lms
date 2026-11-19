import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  authorized: true,
  actor: '00000000-0000-4000-8000-000000000001',
  sourceError: false,
  sourceMissing: false,
  sourceReads: 0,
  rpcError: null as null | { code: string },
  committed: null as null | Record<string, unknown>,
  calls: [] as Array<{ name: string; args: Record<string, unknown> }>,
}));
vi.mock('@/lib/with-auth', () => ({ withAuth: (handler: (...args: unknown[]) => unknown) => (req: NextRequest) => {
  if (!state.authorized) return new Response('Forbidden', { status: 403 });
  return handler(req, { user: { id: state.actor } });
} }));
vi.mock('@/lib/audit/withApiAudit', () => ({ withApiAudit: (_path: string, handler: unknown) => handler }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: (table: string) => {
    if (table !== 'blog_posts') throw new Error('Direct campaign/post writes must use the atomic RPC');
    state.sourceReads += 1;
    const query = {
      select: () => query, in: () => query, eq: () => query,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve({
        data: state.sourceMissing ? [] : [{ id: 'blog-id', title: 'Approved blog', slug: 'approved-blog', updated_at: '2026-11-19T12:00:00Z' }],
        error: state.sourceError ? { message: 'private backend diagnostic' } : null,
      }).then(resolve),
    };
    return query;
  },
  rpc: async (name: string, args: Record<string, unknown>) => {
    state.calls.push({ name, args });
    const campaign = args.p_campaign as { metadata: { saveActorId: string; saveFingerprint: string } };
    if (args.p_posts === null) {
      if (!state.committed) return { data: null, error: null };
      const metadata = state.committed.metadata as typeof campaign.metadata;
      if (metadata.saveActorId !== campaign.metadata.saveActorId ||
          metadata.saveFingerprint !== campaign.metadata.saveFingerprint) {
        return { data: null, error: { code: '22023' } };
      }
      return { data: { campaign: state.committed, draftCount: 1, replayed: true }, error: null };
    }
    if (state.rpcError) return { data: null, error: state.rpcError };
    state.committed = campaign;
    return { data: { campaign, draftCount: 1, replayed: false }, error: null };
  },
}) }));
vi.mock('@/lib/social/blog-social-pipeline', () => ({ generateBlogSocialPackage: async () => ({
  package: { caption: 'Approved caption', hashtags: ['#QA'] }, provider: 'deterministic', model: 'template',
}) }));
import { POST } from '@/apps/admin/app/api/social-media/campaigns/route';

const requestId = '81b84ef5-3610-4e28-8e69-a74cf2ed394c';
const save = (body: Record<string, unknown> = {}) => POST(new NextRequest('http://localhost/api/social-media/campaigns', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ requestId, name: 'QA editorial plan', platforms: ['facebook'], sourceBlogIds: ['blog-id'], ...body }),
}));
beforeEach(() => {
  state.authorized = true;
  state.actor = '00000000-0000-4000-8000-000000000001';
  state.sourceError = false;
  state.sourceMissing = false;
  state.sourceReads = 0;
  state.rpcError = null;
  state.committed = null;
  state.calls = [];
});

describe('guarded atomic social campaign saves', () => {
  it('saves the campaign and unapproved posts in one trusted RPC', async () => {
    const response = await save();
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ success: true, draftCount: 1 });
    expect(state.calls).toHaveLength(2);
    expect(state.calls[0].args).toMatchObject({ p_posts: null });
    expect(state.calls[1].name).toBe('save_social_campaign_draft');
    expect(state.calls[1].args).toMatchObject({
      p_campaign: { id: requestId, status: 'draft', metadata: { saveActorId: '00000000-0000-4000-8000-000000000001' } },
      p_posts: [{ status: 'pending_approval', approval_state: 'pending', approved_at: null, scheduled_at: null, generation_payload: { campaignId: requestId } }],
    });
  });
  it('returns the committed save after its selected source becomes unavailable', async () => {
    await save();
    state.sourceMissing = true;
    const response = await save();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ campaign: state.committed, draftCount: 1, replayed: true });
    expect(state.sourceReads).toBe(1);
    expect(state.calls).toHaveLength(3);
    expect(state.calls[2].args).toMatchObject({ p_posts: null });
  });
  it('rejects changed content and a different actor without reading sources or writing again', async () => {
    await save();
    const changed = await save({ name: 'Changed plan' });
    expect(changed.status).toBe(409);
    expect(await changed.json()).not.toHaveProperty('campaign');
    state.actor = '00000000-0000-4000-8000-000000000002';
    const otherActor = await save();
    expect(otherActor.status).toBe(409);
    expect(await otherActor.json()).not.toHaveProperty('campaign');
    expect(state.sourceReads).toBe(1);
    expect(state.calls.filter(({ args }) => args.p_posts !== null)).toHaveLength(1);
  });
  it('normalizes uppercase UUIDs before constructing post identities', async () => {
    expect((await save({ requestId: requestId.toUpperCase() })).status).toBe(201);
    expect(state.calls[0].args.p_campaign).toMatchObject({ id: requestId });
  });
  it.each([undefined, 'not-a-uuid'])('rejects invalid request identity %s before saving', async requestId => {
    expect((await save({ requestId })).status).toBe(400);
    expect(state.calls).toEqual([]);
  });
  it('preserves authorization rejection without database mutation', async () => {
    state.authorized = false;
    expect((await save()).status).toBe(403);
    expect(state.calls).toEqual([]);
  });
  it('does not save partial plans when source lookup fails', async () => {
    state.sourceError = true;
    const response = await save();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private backend diagnostic');
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].args.p_posts).toBeNull();
    expect(state.committed).toBeNull();
  });
  it('rejects stale or unpublished selected sources before saving', async () => {
    state.sourceMissing = true;
    expect((await save()).status).toBe(409);
    expect(state.calls).toHaveLength(1);
    expect(state.calls[0].args.p_posts).toBeNull();
    expect(state.committed).toBeNull();
  });
  it.each(['22023', '23502'])('reports RPC failure %s without claiming a save', async code => {
    state.rpcError = { code };
    const response = await save();
    expect(response.status).toBe(code === '22023' ? 409 : 500);
    expect(await response.json()).not.toHaveProperty('success', true);
  });
});
