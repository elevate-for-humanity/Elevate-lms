import { beforeEach, describe, expect, it, vi } from 'vitest';
const { state, route } = vi.hoisted(() => ({
  state: { messages: [] as any[], threads: [] as any[], mailboxes: [] as any[], notifications: [] as any[], failMailboxIds: [] as string[], failUpload: false, uploadPaths: [] as string[], attachments: [] as any[] },
  route: vi.fn(),
}));
vi.mock('@/lib/email/program-conversation-routing', async (original) => ({
  ...(await original<any>()),
  programConversationRoute: route,
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    storage: { from: () => ({ upload: async (path: string) => {
      state.uploadPaths.push(path);
      return { error: state.failUpload ? { message: 'Unavailable' } : null };
    } }) },
    from: (table: string) => {
      let inserted: any;
      let requested: string[] | null = null;
      let address: string | null = null;
      let messageEvent: string | null = null;
      let messageUpdate: Record<string, string> | null = null;
      const query: any = {
        select: () => query,
        eq: (key: string, value: any) => { if (key === 'address') address = value;
          if (key === 'inbound_event_id') messageEvent = value;
          if (key === 'id' && table === 'communication_email_messages' && messageUpdate) {
            const message = state.messages.find(row => row.id === value);
            if (message) Object.assign(message, messageUpdate);
          }
          return query; },
        order: () => query,
        limit: () => query,
        lte: () => query,
        in: (key: string, values: string[]) => { if (key === 'address') requested = values; return query; },
        insert: (row: any) => {
          inserted = row;
          if (table === 'communication_email_messages') state.messages.push(row);
          else state.threads.push(row);
          return query;
        },
        upsert: (rows: any) => {
          if (table === 'notifications') state.notifications.push(...rows);
          if (table === 'communication_email_attachments') state.attachments.push(rows);
          return query;
        },
        update: (value: Record<string, string>) => { messageUpdate = value; return query; },
        maybeSingle: async () => ({ data: table === 'communication_email_mailboxes' ? state.mailboxes.find(row => row.address === address) || null : table === 'communication_email_messages' ? state.messages.find(row => row.inbound_event_id === messageEvent) || null : null }),
        single: async () => ({
          data: table === 'communication_email_mailboxes'
            ? state.mailboxes.find(row => row.address === address)
            : table === 'communication_email_folders'
              ? { id: 'routing-review' }
              : { id: `thread-${inserted.mailbox_id}`, message_count: 0 },
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
    state.failUpload = false;
    state.uploadPaths = [];
    state.attachments = [];
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
  it('resolves a tagged admissions address before applying assigned instructor sharing', async () => {
    await storeInboundCommunicationEmail({
      ...parsed,
      envelopeRecipients: ['admissions+intake@elevateforhumanity.org'],
    });
    expect(route).toHaveBeenCalledWith(expect.anything(), ['student@example.com'], ['admissions@elevateforhumanity.org']);
    expect(state.messages.map((message) => message.mailbox_id)).toEqual(['admin', 'holder']);
  });

  it('retries Unicode attachments at the same safe key while preserving the display name', async () => {
    route.mockResolvedValue(null);
    const mail = {
      ...parsed,
      attachments: [new File(['application'], 'Résumé.pdf', { type: 'application/pdf' })],
    };
    state.failUpload = true;
    await expect(storeInboundCommunicationEmail(mail)).rejects.toThrow('Inbound attachment storage unavailable');
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].status).toBe('pending');

    state.failUpload = false;
    await expect(storeInboundCommunicationEmail(mail)).resolves.toMatchObject({ stored: true });
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].status).toBe('received');
    expect(state.uploadPaths).toEqual([expect.stringMatching(/^admin\/[\w-]+\/0$/), state.uploadPaths[0]]);
    expect(state.attachments).toEqual([expect.objectContaining({ file_name: 'Résumé.pdf' })]);
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
  it('stores unresolved recipients in staff routing review', async () => {
    route.mockResolvedValue(null);
    const result = await storeInboundCommunicationEmail({...parsed,to:'unknown@elevateforhumanity.org',envelopeRecipients:['unknown@elevateforhumanity.org']});
    expect(result).toEqual({ stored: false, mailboxCount: 0, review: true });
    expect(state.messages[0]).toMatchObject({ mailbox_id: 'admin', subject: 'Routing error: Re: CDL status' });
    expect(state.threads[0]).toMatchObject({ custom_folder_id: 'routing-review' });
    expect(state.notifications).toEqual([]);
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

it('routes tagged envelope recipients while keeping blind addresses out of message headers', async () => {
  route.mockResolvedValue(null);
  state.messages = [];
  state.threads = [];
  state.notifications = [];
  state.failMailboxIds = [];
  state.mailboxes = [
    { id: 'support', address: 'support@elevateforhumanity.org' },
    { id: 'staff', address: 'staff@elevateforhumanity.org' },
  ];
  expect(await storeInboundCommunicationEmail({
    ...parsed,
    to: 'support+qa@elevateforhumanity.org',
    envelopeRecipients: ['support+qa@elevateforhumanity.org', 'staff@elevateforhumanity.org'],
  })).toEqual({ stored: true, mailboxCount: 2 });
  expect(state.messages.map(message => message.mailbox_id)).toEqual(['support', 'staff']);
  expect(state.messages.every(message =>
    message.to_addresses.length === 1 && message.bcc_addresses.length === 0,
  )).toBe(true);
});
