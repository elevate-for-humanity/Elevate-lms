import { describe, expect, it } from 'vitest';
import {
  inboundAttachmentEntries,
  parseEnvelopeAddresses,
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
