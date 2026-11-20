import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APPROVED_LEARNER_DASHBOARD_URL,
  PENDING_LEARNER_ACCESS_URL,
  paidApplicationStatusForUrl,
  safeStudentApplicationNextStep,
  isExternalStudentApplicationNextStep,
} from '../../lib/enrollment/paid-admission-response';

describe('paid application requires administrator approval before LMS access', () => {
  it('never describes a paid-but-unapproved application as enrolled', () => {
    expect(paidApplicationStatusForUrl(PENDING_LEARNER_ACCESS_URL)).toBe('pending_approval');
    expect(paidApplicationStatusForUrl('/apply/success')).toBe('pending_approval');
    expect(paidApplicationStatusForUrl(APPROVED_LEARNER_DASHBOARD_URL)).toBe('enrolled');
  });

  it('preserves authorized pending-access routing and rejects open redirects', () => {
    const fallback = '/apply/success?ref=test';
    for (const allowed of [APPROVED_LEARNER_DASHBOARD_URL, PENDING_LEARNER_ACCESS_URL,
      'https://app.elevateforhumanity.org/apprentice',
      'https://app.elevateforhumanity.org/learner/dashboard',
      '/apply/success?ref=test']) {
      expect(safeStudentApplicationNextStep(allowed, fallback)).toBe(allowed);
    }
    expect(isExternalStudentApplicationNextStep(PENDING_LEARNER_ACCESS_URL)).toBe(true);
    expect(isExternalStudentApplicationNextStep('/apply/success')).toBe(false);
    for (const unsafe of ['https://attacker.example/redirect', '//attacker.example',
      '/%2fattacker.example', '/\\attacker.example', 'javascript:alert(1)', null, {}]) {
      expect(safeStudentApplicationNextStep(unsafe, fallback)).toBe(fallback);
    }
  });

  it('keeps every public entry and confirmation consistent with the approval gate', () => {
    const affected = [
      'apps/marketing/app/api/applications/route.ts',
      'apps/marketing/app/apply/student/StudentApplicationForm.tsx',
      'apps/marketing/app/enroll/[programId]/page.tsx',
      'apps/marketing/app/program-inquiry/page.tsx',
      'components/programs/ProgramDetailPage.tsx',
    ];
    const obsolete = [
      'activate enrollment and your dashboard',
      'activates your enrollment and dashboard',
      'activate my enrollment and dashboard',
      'Your enrollment and dashboard activate automatically',
      'Dashboard activation follows verified payment and complete submission',
      'Enrollment activated. Opening your dashboard.',
    ];
    for (const path of affected) {
      const content = readFileSync(join(process.cwd(), path), 'utf8');
      for (const phrase of obsolete) expect(content, `${path}: ${phrase}`).not.toContain(phrase);
    }
    const api = readFileSync(join(process.cwd(), affected[0]), 'utf8');
    expect(api).toContain('applicationStatus: paidApplicationStatusForUrl(dashboardUrl)');
    const form = readFileSync(join(process.cwd(), affected[1]), 'utf8');
    expect(form).toContain("activated: data.applicationStatus === 'enrolled'");
    expect(form).toContain('safeStudentApplicationNextStep(data.nextStepUrl');
  });
});
