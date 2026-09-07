import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const workspace = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderWorkspaceView.tsx'),
  'utf8',
);
const upload = fs.readFileSync(
  path.resolve('components/program-holder/ProgramHolderDocumentUpload.tsx'),
  'utf8',
);
const inbound = fs.readFileSync(
  path.resolve('apps/lms/app/api/webhooks/sendgrid-inbound/route.ts'),
  'utf8',
);
const paris = fs.readFileSync(path.resolve('supabase/functions/paris-response/index.ts'), 'utf8');
const holderMou = fs.readFileSync(
  path.resolve('apps/lms/app/program-holder/sign-mou/page.tsx'),
  'utf8',
);
const holderOnboarding = fs.readFileSync(
  path.resolve('apps/lms/app/program-holder/onboarding/page.tsx'),
  'utf8',
);

describe('portal routing and PARIS inbound email', () => {
  it('uses real portal routes and does not link to the removed report form', () => {
    expect(workspace).not.toContain('/program-holder/reports/new');
    expect(workspace).toContain('/program-holder/documents');
    expect(workspace).toContain('/program-holder/sign-mou');
  });

  it('sends ineligible Program Holder sessions to the real Marketing application', () => {
    const applicationUrl =
      'https://www.elevateforhumanity.org/apply/program-holder?status=pending';
    expect(holderMou).toContain(applicationUrl);
    expect(holderOnboarding).toContain(applicationUrl);
    expect(holderMou).not.toContain("redirect('/apply/program-holder?status=pending')");
    expect(holderOnboarding).not.toContain("redirect('/apply/program-holder?status=pending')");
  });

  it('shows HVAC uploads only when HVAC is assigned', () => {
    expect(upload).toMatch(/isHvac\s*\?/);
    expect(upload).toContain("['epa_608', 'EPA Section 608 certification']");
  });

  it('connects inbound applicant replies to PARIS without self-reply loops', () => {
    expect(inbound).toContain('/functions/v1/paris-response');
    expect(inbound).toContain("endsWith('@elevateforhumanity.org')");
    expect(paris).toContain('getSignupUrl(app.program_interest)');
    expect(paris).toContain('Continue ${programName} signup');
  });
});
