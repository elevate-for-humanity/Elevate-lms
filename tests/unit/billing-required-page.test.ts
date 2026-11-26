/**
 * Payment-denial enforcement: /billing-required landing page.
 *
 * A denied student must be able to reach this page: it is billing-exempt
 * in lib/auth/route-guards.ts, it is not in the LMS middleware
 * PROTECTED_PREFIXES, and the page itself must not call any auth guard.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { isBillingExempt } from '@/lib/auth/route-guards';

const PAGE_SRC = fs.readFileSync(
  path.resolve('apps/lms/app/billing-required/page.tsx'),
  'utf-8',
);

describe('billing-required reachability', () => {
  it('is exempt from the barber payment guard', () => {
    expect(isBillingExempt('/billing-required')).toBe(true);
    expect(isBillingExempt('/billing-required?reason=payment_failed')).toBe(true);
  });

  it('does not exempt unrelated routes', () => {
    expect(isBillingExempt('/lms/dashboard')).toBe(false);
    expect(isBillingExempt('/billing')).toBe(false);
  });
});

describe('billing-required page content', () => {
  it('exists and explains the payment denial', () => {
    expect(PAGE_SRC).toContain('Payment Required');
    expect(PAGE_SRC).toMatch(/past due|past-due/i);
    expect(PAGE_SRC).toMatch(/no one is exempt/i);
  });

  it('gives the student a way to pay', () => {
    expect(PAGE_SRC).toContain('href="/billing"');
    expect(PAGE_SRC).toContain('Pay Your Balance');
  });

  it('gives the student a contact option', () => {
    expect(PAGE_SRC).toContain('billing@elevateforhumanity.org');
  });

  it('performs no auth check that could bounce a denied student away', () => {
    // The doc comment names these guards to explain why they must stay out;
    // assert on imports and invocations, not on the comment text.
    expect(PAGE_SRC).not.toMatch(/from\s+['"]@\/lib\/auth\//);
    expect(PAGE_SRC).not.toMatch(/await\s+require(User|PortalAccess|Roles)\s*\(/);
    expect(PAGE_SRC).not.toContain("redirect('/unauthorized')");
    expect(PAGE_SRC).not.toContain("redirect('/login");
  });
});
