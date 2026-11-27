import { describe, expect, it } from 'vitest';
import { buildProgramHolderApprovalMessage, isGaryRegionalCoordinator } from '@/lib/program-holder/approval-message';

const base = {
  organizationName: 'Fixture Cleaning <Company>', contactName: 'Fixture Contact', email: 'owner@fixture.test',
  accountRole: 'program_holder' as const, programSlugs: ['verified-building-services'],
  accessUrl: 'https://app.elevateforhumanity.org/login?next=/program-holder/sign-mou',
  portalUrl: 'https://app.elevateforhumanity.org/program-holder/dashboard',
  isNewUser: false, alreadySigned: false, supportPhone: '317-555-0100',
};

describe('program-holder approval messages', () => {
  it('uses the approved role and program without another region’s compensation', () => {
    const message = buildProgramHolderApprovalMessage(base);
    expect(message.subject).toContain('Program Holder');
    expect(message.html).toContain('Fixture Cleaning &lt;Company&gt;');
    expect(message.html).toContain('verified-building-services');
    expect(message.html).toContain('applicable written agreement');
    expect(message.html).not.toMatch(/Gary|\$1,000|\$500/);
  });
  it('uses coordinator wording only for the actual coordinator role', () => {
    expect(buildProgramHolderApprovalMessage({ ...base, accountRole: 'site_coordinator' }).subject).toContain('Site Coordinator');
    expect(isGaryRegionalCoordinator({ approved_role: 'Program Holder', regional_assignment: 'Gary' })).toBe(false);
    expect(isGaryRegionalCoordinator({ approved_role: 'Site Coordinator', regional_assignment: 'Indianapolis' })).toBe(false);
    expect(isGaryRegionalCoordinator({ approved_role: 'Gary Regional Site Coordinator' })).toBe(true);
    expect(isGaryRegionalCoordinator({ approved_role: 'Site Coordinator', regional_assignment: 'Gary, Indiana — 30 miles' })).toBe(true);
  });
  it('preserves the onboarding distinction for a newly created account and a signed agreement', () => {
    const message = buildProgramHolderApprovalMessage({ ...base, isNewUser: true, alreadySigned: true });
    expect(message.html).toContain('Set Password & Continue Onboarding');
    expect(message.html).not.toContain('Review and sign');
    expect(message.html).toContain('required organization, instructor');
  });
  it('sends a new account to password recovery when a one-time setup link is unavailable', () => {
    const message = buildProgramHolderApprovalMessage({ ...base, isNewUser: true, requiresRecovery: true, accessUrl: 'https://app.elevateforhumanity.org/reset-password?portal=program-holder' });
    expect(message.html).toContain('Request Password Setup Link');
    expect(message.html).toContain('/reset-password?portal=program-holder');
    expect(message.html).not.toContain('Set Password & Continue Onboarding');
    expect(message.html).toContain('before your first sign-in');
  });
});
