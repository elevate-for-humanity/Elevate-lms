import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';

const mocks = vi.hoisted(() => ({ client: vi.fn(), insert: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error('redirect:' + url); } }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import ConversationPage from '@/apps/lms/app/lms/(app)/messages/[id]/page';

const viewer = '10000000-0000-4000-8000-000000000001';
const other = '10000000-0000-4000-8000-000000000002';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  const query = { select: () => query, or: () => query, order: () => query, limit: async () => ({ data: [], error: null }), insert: mocks.insert };
  mocks.client.mockResolvedValue({ from: () => query, rpc: async () => ({ data: [{ community_allow_messages: true }], error: null }), auth: { getUser: async () => ({ data: { user: { id: viewer } } }) } });
});
async function action() {
  const page = await ConversationPage({ params: Promise.resolve({ id: other }) }) as ReactElement<{ children: ReactNode[] }>;
  const composer = page.props.children.find(child => isValidElement(child) && typeof (child.props as { action?: unknown }).action === 'function') as ReactElement<{ action: (form: FormData) => Promise<unknown> }>;
  return composer.props.action;
}
function draft(content = 'A test draft', recipient = other) {
  const form = new FormData(); form.set('recipient_id', recipient); form.set('content', content); form.set('sender_id', 'forged-sender'); return form;
}

describe('learner conversation send results', () => {
  it('returns a useful failure when database policy rejects sending', async () => {
    mocks.insert.mockResolvedValue({ error: { code: '42501' } });
    expect(await (await action())(draft())).toEqual({ error: 'You cannot send a message to this member.' });
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it('reports a database failure without exposing its internal details', async () => {
    mocks.insert.mockResolvedValue({ error: { code: '08006', message: 'private database details' } });
    expect(await (await action())(draft())).toEqual({ error: 'Your message could not be sent. Please try again.' });
  });
  it('reports an uncertain transport failure without promising that nothing was delivered', async () => {
    mocks.insert.mockRejectedValue(new Error('network disconnected'));
    expect(await (await action())(draft())).toEqual({ error: 'We could not confirm whether your message was sent. Review the conversation before trying again.' });
  });
  it('rejects invalid input and self-messaging before writing', async () => {
    const send = await action();
    for (const form of [draft(''), draft('x'.repeat(5001)), draft('hello', 'invalid'), draft('hello', viewer)]) {
      expect(await send(form)).toHaveProperty('error');
    }
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it('uses the authenticated sender and refreshes both views only after a successful insert', async () => {
    await expect((await action())(draft('  Saved draft  '))).rejects.toThrow(`redirect:/lms/messages/${other}`);
    expect(mocks.insert).toHaveBeenCalledWith({ sender_id: viewer, recipient_id: other, content: 'Saved draft' });
    expect(mocks.revalidate.mock.calls.map(args => args[0])).toEqual([`/lms/messages/${other}`, '/lms/messages']);
  });
});
