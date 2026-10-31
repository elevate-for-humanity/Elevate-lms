import { describe, expect, it } from 'vitest';
import {
  apprenticeshipLmsCoursePath,
  apprenticeshipOrientationPath,
  apprenticeshipRtiLabel,
  apprenticeshipWorkbookHref,
  isWorkoneChecklistEligibleApplication,
} from '@/lib/portal/program-portal-paths';

describe('program-portal-paths', () => {
  it('uses the same assignment-aware course launch for all beauty programs and future apprenticeships', () => {
    for (const slug of ['barber-apprenticeship', 'cosmetology-apprenticeship', 'esthetician-apprenticeship', 'nail-technician-apprenticeship', 'future-apprenticeship']) {
      expect(apprenticeshipLmsCoursePath(slug)).toBe('/apprentice/theory');
    }
    expect(apprenticeshipLmsCoursePath('bookkeeping')).toBeNull();
  });
  it('routes barber orientation to program page', () => {
    expect(apprenticeshipOrientationPath('barber-apprenticeship')).toBe(
      '/apprentice/orientation?program=barber-apprenticeship',
    );
  });

  it('routes barber RTI through the current enrollment', () => {
    expect(apprenticeshipLmsCoursePath('barber-apprenticeship')).toBe(
      '/apprentice/theory',
    );
    expect(apprenticeshipRtiLabel('barber-apprenticeship')).toBe(
      'Barber theory course',
    );
    expect(apprenticeshipWorkbookHref('barber-apprenticeship')).toBe(
      '/workbooks',
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
