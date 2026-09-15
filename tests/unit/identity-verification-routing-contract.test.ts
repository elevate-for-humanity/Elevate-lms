import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const lmsRoute = readFileSync('apps/lms/app/api/verification/submit/route.ts', 'utf8');
const marketingRoute = readFileSync('apps/marketing/app/api/verification/submit/route.ts', 'utf8');
const lmsPage = readFileSync('apps/lms/app/verify-identity/page.tsx', 'utf8');
const sharedHandler = readFileSync('lib/api/verification-submit-route.ts', 'utf8');

describe('identity verification routing contract', () => {
  it('exposes the same submission service from both applications', () => {
    expect(lmsRoute).toContain("from '@/lib/api/verification-submit-route'");
    expect(marketingRoute).toContain("from '@/lib/api/verification-submit-route'");
    expect(sharedHandler).toContain('export async function POST');
  });

  it('uses the secure form whose fields match the submission service', () => {
    expect(lmsPage).toContain('SecureIdentityVerificationForm');
    expect(lmsPage).not.toContain('<IDVerificationForm');
    expect(sharedHandler).toContain("form.get('ssn')");
  });
});
