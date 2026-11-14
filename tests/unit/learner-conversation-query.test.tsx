import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const mocks = vi.hoisted(() => ({ client: vi.fn(), select: vi.fn(), or: vi.fn(), rpc: vi.fn(), messageError: false, memberError: false, readError: false }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error('redirect:' + url); } }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
import ConversationPage from '@/apps/lms/app/lms/(app)/messages/[id]/page';

const viewer = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
const messages = Array.from({ length: 251 }, (_, i) => ({
  id: String(i), sender_id: other, recipient_id: viewer,
  content: i === 250 ? null : `Saved message ${i}.`, body: i === 250 ? 'Newest legacy message.' : null,
  created_at: new Date(Date.UTC(2026, 9, 29, 0, i)).toISOString(), read_at: null,
}));
let returnedRows = messages;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.messageError = mocks.memberError = mocks.readError = false;
  returnedRows = messages;
  let ascending = true;
  let projection = '';
  const query = {
    select: mocks.select.mockImplementation((value: string) => { projection = value; return query; }),
    or: mocks.or.mockImplementation(() => query),
    order: (_key: string, options: { ascending: boolean }) => { ascending = options.ascending; return query; },
    limit: async (count: number) => mocks.messageError ? { data: null, error: { code: '08006' } } : {
      data: (ascending ? [...returnedRows] : [...returnedRows].reverse()).slice(0, count).map(row => ({ ...row, body: projection.split(',').includes('body') ? row.body : undefined })), error: null,
    },
  };
  mocks.rpc.mockImplementation(async (name: string) => name === 'get_community_member'
    ? { data: mocks.memberError ? null : [{ full_name: 'Visible Member', community_allow_messages: true }], error: mocks.memberError ? { code: '08006' } : null }
    : { data: null, error: mocks.readError ? { code: '08006' } : null });
  mocks.client.mockResolvedValue({ from: () => query, rpc: mocks.rpc, auth: { getUser: async () => ({ data: { user: { id: viewer } } }) } });
});

const render = async () => renderToStaticMarkup(await ConversationPage({ params: Promise.resolve({ id: other }) }));

describe('learner conversation reads', () => {
  it('shows the latest 250 messages in chronological order, including legacy message bodies', async () => {
    const html = await render();
    expect(html).toContain('Newest legacy message.');
    expect(html).toContain('Saved message 1.');
    expect(html).not.toContain('Saved message 0.');
    expect(html.indexOf('Saved message 1.')).toBeLessThan(html.indexOf('Newest legacy message.'));
    expect(html).toContain('Showing the latest 250 messages.');
    expect(mocks.or).toHaveBeenCalledWith(`and(sender_id.eq.${viewer},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${viewer})`);
  });
  it('reports a failed message read without claiming an empty thread or marking unread messages read', async () => {
    mocks.messageError = true;
    const html = await render();
    expect(html).toContain('Conversation is temporarily unavailable');
    expect(html).not.toContain('Start the conversation');
    expect(html).not.toContain('<textarea');
    expect(mocks.rpc).not.toHaveBeenCalledWith('mark_community_messages_read', expect.anything());
  });
  it('does not misreport a failed member lookup as a member refusing new messages', async () => {
    returnedRows = [];
    mocks.memberError = true;
    const html = await render();
    expect(html).toContain('Conversation is temporarily unavailable');
    expect(html).not.toContain('not accepting new community messages');
    expect(mocks.rpc).not.toHaveBeenCalledWith('mark_community_messages_read', expect.anything());
  });
  it('keeps an existing thread visible when its safe participant lookup fails', async () => {
    mocks.memberError = true;
    const html = await render();
    expect(html).toContain('Newest legacy message.');
    expect(html).toContain('Member details are temporarily unavailable.');
    expect(html).toContain('Elevate Member');
  });
  it('reports failed read receipts while preserving the conversation', async () => {
    mocks.readError = true;
    const html = await render();
    expect(html).toContain('Newest legacy message.');
    expect(html).toContain('Your messages could not be marked as read.');
  });
});
