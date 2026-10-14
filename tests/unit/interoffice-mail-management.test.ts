import { describe, it, expect } from 'vitest';
import { validateMailAction } from '@/lib/email/mail-management';
import { applyMailFilters, canParisRespond, isRelevantCopy } from '@/lib/email/mail-filters';
const mailbox = '11111111-1111-4111-8111-111111111111';
describe('mail organization and copied-message rules', () => {
  it('rejects malformed actions, invalid folder IDs, and excessive selections', () => {
    expect(validateMailAction({ mailboxId: mailbox, action: 'eraseEverything' })).toBeTruthy();
    expect(
      validateMailAction({
        mailboxId: mailbox,
        action: 'move',
        threadIds: [mailbox],
        folderId: 'other',
      }),
    ).toBeTruthy();
    expect(
      validateMailAction({
        mailboxId: mailbox,
        action: 'move',
        threadIds: Array(101).fill(mailbox),
        folder: 'trash',
      }),
    ).toBeTruthy();
    expect(
      validateMailAction({
        mailboxId: mailbox,
        action: 'move',
        threadIds: [mailbox],
        folder: 'trash',
      }),
    ).toBeNull();
  });
  it('preserves rule order and skips disabled rules', () => {
    const rules: any = [
      { enabled: false, field: 'subject', contains: 'January', action: 'spam' },
      { enabled: true, field: 'sender', contains: 'newsletter', action: 'skip' },
      {
        enabled: true,
        field: 'subject',
        contains: 'January',
        action: 'folder',
        folder_id: mailbox,
      },
    ];
    expect(
      applyMailFilters(rules, { sender: 'newsletter@example.org', subject: 'January', body: '' })
        ?.skip,
    ).toBe(true);
    expect(
      applyMailFilters(rules, { sender: 'applicant@example.org', subject: 'January', body: '' })
        ?.folderId,
    ).toBe(mailbox);
  });
  it('excludes automated/private copied mail while retaining admission messages', () => {
    expect(
      isRelevantCopy({ sender: 'bank@example.com', subject: 'Payment receipt', body: '' }),
    ).toBe(false);
    expect(
      isRelevantCopy({
        sender: 'applicant@example.com',
        subject: 'January barber application',
        body: 'yes',
      }),
    ).toBe(true);
    expect(canParisRespond({ from: 'admin@www.elevateforhumanity.org', subject: 'Hi' })).toBe(
      false,
    );
    expect(
      canParisRespond({
        from: 'person@example.com',
        subject: 'Hello',
        headers: 'Auto-Submitted: auto-replied',
      }),
    ).toBe(false);
    expect(canParisRespond({ from: 'person@example.com', subject: 'January interview' })).toBe(
      true,
    );
  });
  it('requires a valid filter destination and bounded match', () => {
    expect(
      validateMailAction({
        mailboxId: mailbox,
        action: 'createFilter',
        field: 'body',
        contains: 'application',
        filterAction: 'folder',
      }),
    ).toBeTruthy();
    expect(
      validateMailAction({
        mailboxId: mailbox,
        action: 'createFilter',
        field: 'subject',
        contains: 'Newsletter',
        filterAction: 'skip',
      }),
    ).toBeNull();
  });
});
