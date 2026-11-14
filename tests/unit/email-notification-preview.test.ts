import { expect, it, vi } from 'vitest';
import { alertPresentation } from '@/lib/notifications/pwa-alert-settings';
import { notifyParisMailResult } from '@/lib/email/paris-mail-notification';
it('shows the authorized sender, subject and short preview without leaking the unselected full body', () => {
  expect(
    alertPresentation(
      {
        metadata: {
          sender_email: 'andrew@epa.gov',
          mailbox_address: 'testing@elevateforhumanity.org',
          subject: 'Application review',
          preview: 'Your application is under review',
        },
        text_body: 'private details',
      },
      'email',
    ),
  ).toEqual({
    title: 'New email from andrew@epa.gov',
    body: 'Application review · Your application is under review',
  });
  const preview = alertPresentation({
    metadata: { sender_email: 'andrew@epa.gov', subject: 'Application review', preview: 'Short authorized preview' },
    text_body: 'Confidential extended message',
  }, 'email');
  expect(preview.body).toContain('Short authorized preview');
  expect(preview.body).not.toContain('Confidential extended message');
});
it('distinguishes PARIS sent and failed replies and strips control characters', () => {
  expect(
    alertPresentation(
      { metadata: { email_status: 'sent', recipient: 'Andrew', subject: 'EPA\nreview\u202e' } },
      'email',
    ),
  ).toEqual({ title: 'PARIS replied to Andrew', body: 'EPA review' });
  expect(
    alertPresentation(
      { metadata: { email_status: 'failed', recipient: 'Andrew', subject: 'EPA' } },
      'email',
    ).title,
  ).toBe('PARIS reply failed to Andrew');
});
it('preserves details on older incoming notifications', () => {
  expect(
    alertPresentation({ message: 'From EPA · To testing · Application' }, 'email').body,
  ).toContain('From EPA');
});
it('notifies only mailbox members with a stable deduplication key after a terminal result', async () => {
  const upsert = vi.fn(async () => ({ error: null }));
  const db = {
    from: (table: string) =>
      table === 'notifications'
        ? { upsert }
        : {
            select: () => ({
              eq: async () => ({
                data: [{ user_id: 'owner' }, { user_id: 'owner' }, { user_id: 'holder' }],
                error: null,
              }),
            }),
          },
  };
  await notifyParisMailResult(db as any, {
    messageId: 'reply1',
    mailboxId: 'admissions',
    mailboxAddress: 'admissions@elevateforhumanity.org',
    recipient: 'applicant@example.org',
    subject: 'Interview',
    status: 'failed',
  });
  const [rows, options] = upsert.mock.calls[0] as any;
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({
    user_id: 'owner',
    idempotency_key: 'email:paris-reply:reply1:owner',
    title: 'PARIS email reply failed',
    metadata: { email_status: 'failed' },
  });
  expect(options.ignoreDuplicates).toBe(true);
});
