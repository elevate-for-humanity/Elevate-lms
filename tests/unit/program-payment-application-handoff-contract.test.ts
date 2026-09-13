import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (relativePath: string) =>
  readFileSync(path.resolve(relativePath), 'utf8');

describe('program payment application handoff contract', () => {
  // This source contract guards the public, server-side redirect chain before browser hydration.
  it('starts payment choices at the canonical PARIS student application', () => {
    const programPage = source('components/programs/ProgramDetailPage.tsx');

    expect(programPage).toContain("`/apply/student?${new URLSearchParams({");
    expect(programPage).toContain("intent: 'enrollment'");
    expect(programPage).toContain("funding: 'self_pay'");
    expect(programPage).toContain('payment: mode');
  });

  it('preserves validated payment and funding choices through the redirect', () => {
    const redirectPage = source('apps/marketing/app/apply/student/page.tsx');

    expect(redirectPage).toContain("['full', 'plan', 'bnpl', 'success']");
    expect(redirectPage).toContain("query.set('payment'");
    expect(redirectPage).toContain("['self_pay', 'workone', 'wioa', 'grant', 'employer']");
    expect(redirectPage).toContain("query.set('funding'");
    expect(redirectPage).toContain("query.set('session_id'");
  });

  it('shows the selected payment path in PARIS and preserves it in the fallback form', () => {
    const interviewPage = source('apps/marketing/app/apply/student/interview/page.tsx');
    const calculator = source('components/programs/PaymentPlanCalculator.tsx');

    expect(interviewPage).toContain('initialPaymentMode={paymentPreference}');
    expect(interviewPage).toContain("...(paymentPreference ? { payment: paymentPreference } : {})");
    expect(interviewPage).toContain("...(fundingPreference ? { funding: fundingPreference } : {})");
    expect(calculator).toContain('Your selected path:');
    expect(calculator).toContain('BNPL appears only when an enabled provider');
  });
});
