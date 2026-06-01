import { describe, expect, it } from 'vitest';
import {
  apprenticeshipLmsCoursePath,
  apprenticeshipOrientationPath,
  isWorkoneChecklistEligibleApplication,
} from '@/lib/portal/program-portal-paths';

describe('program-portal-paths', () => {
  it('routes barber orientation to program page', () => {
    expect(apprenticeshipOrientationPath('barber-apprenticeship')).toBe(
      '/programs/barber-apprenticeship/orientation',
    );
  });

  it('exposes barber Milady LMS course', () => {
    expect(apprenticeshipLmsCoursePath('barber-apprenticeship')).toMatch(
      /^\/lms\/courses\/[0-9a-f-]{36}$/,
    );
  });

  it('excludes barber from WorkOne checklist', () => {
    expect(
      isWorkoneChecklistEligibleApplication({
        program_slug: 'barber-apprenticeship',
        funding_type: 'wioa',
      }),
    ).toBe(false);
    expect(
      isWorkoneChecklistEligibleApplication({
        program_slug: 'hvac-technician',
        funding_type: 'self-pay-plan',
      }),
    ).toBe(false);
    expect(
      isWorkoneChecklistEligibleApplication({
        program_slug: 'prs-indiana',
        funding_type: 'wioa',
      }),
    ).toBe(true);
  });
});
