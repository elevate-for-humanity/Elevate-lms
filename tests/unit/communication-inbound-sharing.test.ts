import { beforeEach, describe, expect, it, vi } from 'vitest';
const { state, route } = vi.hoisted(() => ({
  state: { messages: [] as any[], threads: [] as any[] },
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
      const query: any = {
        select: () => query,
        eq: () => query,
        order: () => query,
        limit: () => query,
        in: () => query,
        insert: (row: any) => {
          inserted = row;
          if (table === 'communication_email_messages') state.messages.push(row);
          else state.threads.push(row);
          return query;
        },
        update: () => query,
        maybeSingle: async () => ({ data: null }),
        single: async () => ({
          data: { id: `thread-${inserted.mailbox_id}`, message_count: 0 },
          error: null,
        }),
        then: (resolve: any) =>
          Promise.resolve({
            data:
              table === 'communication_email_mailboxes'
                ? [
                    { id: 'admin', address: 'admissions@elevateforhumanity.org' },
                    { id: 'holder', address: 'the.cdl.academy@elevateforhumanity.org' },
                  ]
                : null,
            error: null,
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
    state.messages = [];
    state.threads = [];
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
});
