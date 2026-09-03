import { describe, expect, it } from 'vitest';
import {
  apprenticeshipLmsCoursePath,
  apprenticeshipOrientationPath,
  apprenticeshipRtiLabel,
  apprenticeshipWorkbookHref,
  isWorkoneChecklistEligibleApplication,
} from '@/lib/portal/program-portal-paths';
import { BARBER_COURSE_ID } from '@/lib/barber/pricing';

describe('program-portal-paths', () => {
  it('routes barber orientation to program page', () => {
    expect(apprenticeshipOrientationPath('barber-apprenticeship')).toBe(
      '/programs/barber-apprenticeship/orientation',
    );
  });

  it('routes barber RTI to Prestige Elevation LMS course', () => {
    expect(apprenticeshipLmsCoursePath('barber-apprenticeship')).toBe(
      `/lms/courses/${BARBER_COURSE_ID}`,
    );
    expect(apprenticeshipRtiLabel('barber-apprenticeship')).toBe(
      'Prestige Elevation Barber Curriculum',
    );
    expect(apprenticeshipWorkbookHref('barber-apprenticeship')).toBe(
      `/lms/courses/${BARBER_COURSE_ID}?activity=reading`,
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
