import { afterEach, describe, expect, it } from 'vitest';
import { shouldSuppressIsolatedQaApprovalNotifications } from '@/lib/enrollment/qa-notification-safety';

const QA_URL = 'https://isdgjcdabhxxozarmxta.supabase.co';

const ORIGINAL_SUPABASE_URL = process.env.SUPABASE_URL;
const ORIGINAL_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

afterEach(() => {
  if (ORIGINAL_SUPABASE_URL === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = ORIGINAL_SUPABASE_URL;
  if (ORIGINAL_PUBLIC_SUPABASE_URL === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL_PUBLIC_SUPABASE_URL;
});

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

  it('uses the same server-first runtime URL resolution as the admin database client', () => {
    process.env.SUPABASE_URL = QA_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@example.invalid'),
    ).toBe(true);

    process.env.SUPABASE_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_URL = QA_URL;
    expect(
      shouldSuppressIsolatedQaApprovalNotifications('student@example.invalid'),
    ).toBe(false);
  });
});
