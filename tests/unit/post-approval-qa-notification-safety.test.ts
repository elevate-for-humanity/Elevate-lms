import { describe, expect, it } from 'vitest';
import { shouldSuppressIsolatedQaApprovalNotifications } from '@/lib/enrollment/qa-notification-safety';

const QA_URL = 'https://isdgjcdabhxxozarmxta.supabase.co';

describe('isolated QA approval notification boundary', () => {
  it('suppresses only reserved .invalid recipients on the exact isolated QA host', () => {
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@example.invalid', QA_URL),
    ).toBe(true);
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@nested.example.invalid', QA_URL),
    ).toBe(true);
  });

  it('never suppresses a real recipient or a different Supabase project', () => {
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@elevateforhumanity.org', QA_URL),
    ).toBe(false);
    expect(
      shouldSuppressIsolatedQaApprovalNotifications(
        'student@example.invalid',
        'https://cuxzzpsyufcewtmicszk.supabase.co',
      ),
    ).toBe(false);
  });

  it('rejects malformed and lookalike host or recipient values', () => {
    expect(
      shouldSuppressIsolatedQaApprovalNotifications(
        'student@example.invalid.evil.test',
        QA_URL,
      ),
    ).toBe(false);
    expect(
      shouldSuppressIsolatedQaApprovalNotifications(
        'student@example.invalid',
        'https://isdgjcdabhxxozarmxta.supabase.co.evil.test',
      ),
    ).toBe(false);
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@example.invalid', 'not a url'),
    ).toBe(false);
  });
});
