import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ copy: vi.fn(), send: vi.fn(), sequence: 0 }));
vi.mock('@/lib/email/communication-inbound', () => ({
  storeInboundCommunicationEmail: mocks.copy,
}));
vi.mock('@/lib/email/sendgrid', () => ({ sendEmail: mocks.send }));
vi.mock('@/lib/email/paris-mail-notification', () => ({ notifyParisMailResult: vi.fn() }));
vi.mock('@/lib/certificates/enrollment-issuance', () => ({
  enrollmentCertificateAttachments: async () => undefined,
}));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: (table: string) => {
      let action = 'select';
      const result = () => ({
        data:
          table === 'communication_email_outbox'
            ? action === 'select'
              ? [
                  {
                    id: 'delivery-one',
                    campaign_key: 'campaign-shared',
                    recipient_email: 'one@example.org',
                    mailbox_id: 'admissions',
                    user_id: 'one',
                    subject: 'Welcome',
                    body: 'For one',
                  },
                  {
                    id: 'delivery-two',
                    campaign_key: 'campaign-shared',
                    recipient_email: 'two@example.org',
                    mailbox_id: 'admissions',
                    user_id: 'two',
                    subject: 'Welcome',
                    body: 'For two',
                  },
                ]
              : [{ id: 'claimed' }]
            : table === 'communication_email_mailboxes'
              ? [{ address: 'shared-shop@example.org' }]
              : table === 'communication_email_mailbox_members'
                ? [{ mailbox_id: 'shared-shop' }]
                : [],
        error: null,
      });
      const query: any = { then: (resolve: any) => Promise.resolve(result()).then(resolve) };
      for (const method of ['select', 'eq', 'neq', 'in', 'limit', 'order'])
        query[method] = () => query;
      for (const method of ['update', 'insert'])
        query[method] = () => {
          action = method;
          return query;
        };
      query.single = async () => ({
        data:
          table === 'communication_email_mailboxes'
            ? { address: 'admissions@example.org', display_name: 'Admissions' }
            : { id: `record-${++mocks.sequence}` },
        error: null,
      });
      return query;
    },
  }),
}));
import { processInterofficeOutbox } from '@/lib/email/interoffice-outbox';
it('preserves two recipients in one campaign when their copies reach the same shared mailbox', async () => {
  mocks.send.mockResolvedValue({ success: true, data: { messageId: 'accepted' } });
  mocks.copy.mockResolvedValue({ stored: true, mailboxCount: 1 });
  expect(await processInterofficeOutbox()).toMatchObject({ sent: 2, failed: 0 });
  expect(mocks.copy).toHaveBeenCalledTimes(2);
  expect(mocks.copy.mock.calls[0][0]).toMatchObject({
    eventId: 'outbox-copy:delivery-one',
    text: 'For one',
  });
  expect(mocks.copy.mock.calls[1][0]).toMatchObject({
    eventId: 'outbox-copy:delivery-two',
    text: 'For two',
  });
  expect(mocks.copy.mock.calls[0][1]).toEqual({
    internalCopy: true,
    applicantEmail: 'one@example.org',
  });
  expect(mocks.copy.mock.calls[1][1]).toEqual({
    internalCopy: true,
    applicantEmail: 'two@example.org',
  });
});
