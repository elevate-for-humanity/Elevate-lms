import { describe, expect, it } from 'vitest';
import {
  inboundAttachmentEntries,
  parseEnvelopeAddresses,
  parseInboundEmail,
  safeAttachmentName,
} from '@/lib/email/sendgrid-inbound';

describe('SendGrid inbound workspace parsing', () => {
  it('extracts every envelope recipient in lowercase', () => {
    expect(
      parseEnvelopeAddresses(
        JSON.stringify({
          to: ['Admissions <Admissions@ElevateForHumanity.org>', 'shop@example.org'],
        }),
      ),
    ).toEqual(['admissions@elevateforhumanity.org', 'shop@example.org']);
  });

  it('finds form file fields without trusting the attachment count', () => {
    const form = new FormData();
    form.set('attachments', '99');
    form.set('attachment1', new File(['hello'], 'notes.txt', { type: 'text/plain' }));
    form.set('not-a-file', 'value');

    expect(inboundAttachmentEntries(form).map((entry) => entry.name)).toEqual(['notes.txt']);
  });

  it('removes path and control characters from attachment names', () => {
    expect(safeAttachmentName('../student\u0000-record.pdf')).toBe('student-record.pdf');
  });
});

it('separates split-envelope claims while retaining stable mailbox message identity', async () => {
  async function parse(recipients: string[]) {
    const form = new FormData();
    form.set('from','sender@example.org'); form.set('to','admissions@elevateforhumanity.org');
    form.set('subject','Same message'); form.set('text','Original body');
    form.set('headers','Message-ID: <stable@example.org>');
    form.set('envelope',JSON.stringify({to:recipients}));
    return (await parseInboundEmail(new Request('https://test.invalid',{method:'POST',body:form})))!;
  }
  const bcc = await parse(['billing@elevateforhumanity.org']);
  const visible = await parse(['admissions@elevateforhumanity.org']);
  const both = await parse(['billing@elevateforhumanity.org','admissions@elevateforhumanity.org']);
  const retry = await parse(['ADMISSIONS@ELEVATEFORHUMANITY.ORG','billing@elevateforhumanity.org']);
  expect(bcc.eventId).toBe(visible.eventId);
  expect(bcc.deliveryId).not.toBe(visible.deliveryId);
  expect(both.deliveryId).toBe(retry.deliveryId);
});
