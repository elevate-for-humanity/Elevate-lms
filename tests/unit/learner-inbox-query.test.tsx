import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn(), select: vi.fn(), or: vi.fn(), rpc: vi.fn(), queryError: false }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error('redirect:' + url); } }));
import MessagesPage from '@/apps/lms/app/lms/(app)/messages/page';

const rows = [
  { id: 'm3', sender_id: 'other', recipient_id: 'viewer', content: 'Newest answer', body: null, created_at: '2026-10-29T12:00:00Z', read_at: null },
  { id: 'm2', sender_id: 'viewer', recipient_id: 'other', content: 'Earlier question', body: null, created_at: '2026-10-29T11:00:00Z', read_at: '2026-10-29T11:01:00Z' },
  { id: 'm1', sender_id: 'private', recipient_id: 'viewer', content: null, body: 'Legacy saved message', created_at: '2026-10-29T10:00:00Z', read_at: null },
];

beforeEach(() => {
  vi.clearAllMocks(); mocks.queryError = false;
  let invalidRelationship = false;
  const query = {
    select: mocks.select.mockImplementation((projection: string) => { invalidRelationship = projection.includes('profiles!messages_'); return query; }),
    or: mocks.or.mockImplementation(() => query), order: () => query,
    limit: async () => invalidRelationship || mocks.queryError
      ? { data: null, error: { code: invalidRelationship ? 'PGRST200' : '08006' } }
      : { data: rows, error: null },
  };
  mocks.from.mockImplementation((table: string) => { if (table !== 'messages') throw new Error('Private profile table must not be queried'); return query; });
  mocks.rpc.mockImplementation(async (name: string, args: { p_member_id: string }) => {
    expect(name).toBe('get_community_member');
    return { data: args.p_member_id === 'other' ? [{ id: 'other', full_name: 'Visible Member', avatar_url: null }] : [], error: null };
  });
  mocks.client.mockResolvedValue({ from: mocks.from, rpc: mocks.rpc, auth: { getUser: async () => ({ data: { user: { id: 'viewer' } } }) } });
});

const render = async (q?: string) => renderToStaticMarkup(await MessagesPage({ searchParams: Promise.resolve({ q }) }));

describe('learner inbox against the live messages/auth.users relationship', () => {
  it('loads authorized conversations using safe member RPCs instead of a nonexistent profile relationship', async () => {
    const html = await render();
    expect(html).toContain('Newest answer');
    expect(html).toContain('Visible Member');
    expect(html).toContain('Legacy saved message');
    expect(html).toContain('2 unread messages');
    expect(html).not.toContain('Earlier question');
    expect(mocks.or).toHaveBeenCalledWith('sender_id.eq.viewer,recipient_id.eq.viewer');
    expect(mocks.rpc).toHaveBeenCalledTimes(2);
    expect(html).toContain('Elevate Member');
  });
  it('reports a query failure without presenting an empty inbox as successful', async () => {
    mocks.queryError = true;
    const html = await render();
    expect(html).toContain('Messages are temporarily unavailable');
    expect(html).not.toContain('No messages yet');
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('keeps message contents visible and reports a failed safe member lookup', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '08006' } });
    const html = await render();
    expect(html).toContain('Newest answer');
    expect(html).toContain('Some member names are temporarily unavailable');
  });
  it('searches the authorized participant and latest saved message', async () => {
    const html = await render('legacy');
    expect(html).toContain('Legacy saved message');
    expect(html).not.toContain('Newest answer');
  });
});
