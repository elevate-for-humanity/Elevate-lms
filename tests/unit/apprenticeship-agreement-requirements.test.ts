import { describe, expect, it } from 'vitest';
import {
  getRequiredAgreementsForProgram,
  isApprenticeshipProgram,
} from '@/lib/legal/requiredAgreements';

describe('apprenticeship agreement requirements', () => {
  it.each([
    'barber-apprenticeship',
    'cosmetology-apprenticeship',
    'esthetician-apprenticeship',
    'nail-technician-apprenticeship',
  ])('requires the in-portal agreement for %s', (slug) => {
    expect(isApprenticeshipProgram(slug)).toBe(true);
    expect(getRequiredAgreementsForProgram('student', slug).map((item) => item.type))
      .toContain('apprenticeship_agreement');
  });

  it('does not add the apprenticeship agreement to a regular program', () => {
    expect(getRequiredAgreementsForProgram('student', 'hvac-technician').map((item) => item.type))
      .not.toContain('apprenticeship_agreement');
  });
});
