import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const workspace = readFileSync('lib/program-holder/workspace.ts', 'utf8');
const readiness = readFileSync('lib/program-holder/onboarding-readiness.ts', 'utf8');
const uploader = readFileSync('components/program-holder/ProgramHolderDocumentUpload.tsx', 'utf8');
const apprenticePortal = readFileSync('apps/lms/app/apprentice/page.tsx', 'utf8');
const hostPortal = readFileSync('apps/lms/app/host-shop/dashboard/schedule/page.tsx', 'utf8');

describe('program-holder onboarding and RTI portal contract', () => {
  it('shows the September 21 RTI start in both portals', () => {
    expect(apprenticePortal).toContain('Theory/RTI begins Monday, September 21, 2026.');
    expect(hostPortal).toContain('Theory/RTI begins Monday, September 21, 2026.');
  });

  it('requires image release, logo, QuickBooks, and PayPal completion', () => {
    expect(workspace).toContain(".from('image_release_consents')");
    expect(readiness).toContain('Signed image release');
    expect(readiness).toContain('Program Holder company logo');
    expect(readiness).toContain('QuickBooks payment-record connection');
    expect(readiness).toContain('PayPal payout connection');
    expect(uploader).toContain("['company_logo', 'Program Holder company logo']");
  });
});
