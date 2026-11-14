import { beforeEach, describe, expect, it, vi } from 'vitest';
const { state, route } = vi.hoisted(() => ({
  state: { messages: [] as any[], threads: [] as any[], mailboxes: [] as any[], notifications: [] as any[], failMailboxIds: [] as string[] },
  route: vi.fn(),
}));
vi.mock('@/lib/email/program-conversation-routing', async (original) => ({
  ...(await original<any>()),
  programConversationRoute: route,
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let inserted: any;
      let requested: string[] | null = null;
      let address: string | null = null;
      const query: any = {
        select: () => query,
        eq: (key: string, value: any) => { if (key === 'address') address = value; return query; },
        order: () => query,
        limit: () => query,
        in: (key: string, values: string[]) => { if (key === 'address') requested = values; return query; },
        insert: (row: any) => {
          inserted = row;
          if (table === 'communication_email_messages') state.messages.push(row);
          else state.threads.push(row);
          return query;
        },
        upsert: (rows: any[]) => { state.notifications.push(...rows); return query; },
        update: () => query,
        maybeSingle: async () => ({ data: table === 'communication_email_mailboxes' ? state.mailboxes.find(row => row.address === address) || null : null }),
        single: async () => ({
          data: { id: `thread-${inserted.mailbox_id}`, message_count: 0 },
          error: null,
        }),
        then: (resolve: any) =>
          Promise.resolve({
            data:
              table === 'communication_email_mailboxes'
                ? state.mailboxes.filter(row => !requested || requested.includes(row.address))
                : table === 'communication_email_mailbox_members' ? [{ user_id: 'owner' }] : null,
            error: table === 'communication_email_messages' && inserted && state.failMailboxIds.includes(inserted.mailbox_id) ? { message: 'Unavailable' } : null,
          }).then(resolve),
      };
      return query;
    },
  }),
}));
import { storeInboundCommunicationEmail } from '@/lib/email/communication-inbound';
const parsed = {
  from: 'Student <student@example.com>',
  to: 'admissions@elevateforhumanity.org',
  subject: 'Re: CDL status',
  text: 'My appointment is pending.',
  html: '',
  replyTo: '',
  eventId: 'reply-1',
  envelopeRecipients: ['admissions@elevateforhumanity.org'],
  attachments: [],
};
describe('interoffice copies preserve conversations', () => {
  beforeEach(() => {
    route.mockClear();
    state.failMailboxIds = [];
    state.notifications = [];
    state.messages = [];
    state.threads = [];
    state.mailboxes = [{id:'admin',address:'admissions@elevateforhumanity.org'},{id:'holder',address:'the.cdl.academy@elevateforhumanity.org'}];
    route.mockResolvedValue({
      applicantEmail: 'student@example.com',
      addresses: ['admissions@elevateforhumanity.org', 'the.cdl.academy@elevateforhumanity.org'],
    });
  });
  it('stores the same student reply in both mailboxes, with separate protected threads', async () => {
    expect(await storeInboundCommunicationEmail(parsed)).toEqual({ stored: true, mailboxCount: 2 });
    expect(state.messages.map((message) => message.mailbox_id)).toEqual(['admin', 'holder']);
    expect(
      state.messages.every(
        (message) =>
          message.sender_email === 'student@example.com' && message.text_body === parsed.text,
      ),
    ).toBe(true);
    expect(
      state.threads.every((thread) =>
        thread.normalized_subject.endsWith(' :: student@example.com'),
      ),
    ).toBe(true);
  });
  it('links each alert to the stored conversation in its own mailbox', async () => {
    await storeInboundCommunicationEmail(parsed);
    expect(state.notifications).toHaveLength(2);
    for (const notice of state.notifications) {
      const url = new URL(notice.action_url);
      const box = url.searchParams.get('mailboxId');
      expect(url.searchParams.get('threadId')).toBe(`thread-${box}`);
      expect(notice.metadata).toMatchObject({mailbox_id: box, thread_id: `thread-${box}`});
    }
  });
  it('keeps admin identity on a response copy while Reply targets the applicant', async () => {
    await storeInboundCommunicationEmail(
      {
        ...parsed,
        from: 'Elevate Admissions <admissions@elevateforhumanity.org>',
        replyTo: 'student@example.com',
        eventId: 'outbound-1',
      },
      { applicantEmail: 'student@example.com', internalCopy: true },
    );
    expect(state.messages[0]).toMatchObject({
      sender_email: 'admissions@elevateforhumanity.org',
      reply_to: 'student@example.com',
    });
    expect(route).not.toHaveBeenCalled();
  });
  it('keeps Testing mail out of Admissions when Testing has an active mailbox', async () => {
    route.mockResolvedValue(null);
    state.mailboxes.push({id:'testing',address:'testing@elevateforhumanity.org'});
    const result = await storeInboundCommunicationEmail({...parsed,to:'testing@elevateforhumanity.org',envelopeRecipients:['testing@elevateforhumanity.org']});
    expect(result.mailboxCount).toBe(1);
    expect(state.messages.map(message => message.mailbox_id)).toEqual(['testing']);
  });
  it('keeps Admissions fallback for an unknown Elevate recipient', async () => {
    route.mockResolvedValue(null);
    const result = await storeInboundCommunicationEmail({...parsed,to:'unknown@elevateforhumanity.org',envelopeRecipients:['unknown@elevateforhumanity.org']});
    expect(result.mailboxCount).toBe(1);
    expect(state.messages.map(message => message.mailbox_id)).toEqual(['admin']);
  });
});

it('does not deliver a visible To header to a mailbox outside the SMTP envelope', async () => {
  route.mockResolvedValue(null);
  state.messages = [];
  state.threads = [];
  state.notifications = [];
  state.failMailboxIds = [];
  state.mailboxes = [
    { id: 'admin', address: 'admissions@elevateforhumanity.org' },
    { id: 'billing', address: 'billing@elevateforhumanity.org' },
  ];
  await storeInboundCommunicationEmail({
    ...parsed,
    to: 'billing@elevateforhumanity.org',
    envelopeRecipients: ['admissions@elevateforhumanity.org'],
  });
  expect(state.messages.map((message) => message.mailbox_id)).toEqual(['admin']);
  expect(route).toHaveBeenLastCalledWith(
    expect.anything(),
    ['student@example.com'],
    ['admissions@elevateforhumanity.org'],
  );
});
it('keeps visible-header fallback when a legacy delivery has no SMTP envelope', async () => {
  route.mockResolvedValue(null);
  state.messages = [];
  state.threads = [];
  state.notifications = [];
  state.failMailboxIds = [];
  state.mailboxes = [{ id: 'admin', address: 'admissions@elevateforhumanity.org' }];
  expect(await storeInboundCommunicationEmail({ ...parsed, envelopeRecipients: [] })).toMatchObject(
    { stored: true, mailboxCount: 1 },
  );
});
it('does not claim full inbound delivery when one directly addressed mailbox fails', async () => {
  route.mockResolvedValue(null);
  state.messages = [];
  state.threads = [];
  state.notifications = [];
  state.failMailboxIds = ['billing'];
  state.mailboxes = [
    { id: 'admin', address: 'admissions@elevateforhumanity.org' },
    { id: 'billing', address: 'billing@elevateforhumanity.org' },
  ];
  await expect(
    storeInboundCommunicationEmail({
      ...parsed,
      to: 'admissions@elevateforhumanity.org,billing@elevateforhumanity.org',
      envelopeRecipients: ['admissions@elevateforhumanity.org', 'billing@elevateforhumanity.org'],
    }),
  ).rejects.toThrow('could not be stored');
});
