import { describe, expect, it } from 'vitest';
import { binderChecklistFor, requiresClinicalDocuments } from '@/lib/admissions/on-application-submitted';

describe('admissions binder checklist', () => {
  it('uses the base checklist for general programs', () => {
    expect(binderChecklistFor('it-help-desk').map((d) => d.documentType)).toEqual([
      'government_id', 'ssn_card', 'hs_diploma_or_ged', 'income_verification', 'proof_of_residency',
    ]);
  });

  it('adds clinical documents for healthcare without default screening', () => {
    expect(requiresClinicalDocuments('medical-assistant')).toBe(true);
    expect(requiresClinicalDocuments('barber-apprenticeship')).toBe(false);
    expect(requiresClinicalDocuments('hvac-technician')).toBe(false);
    expect(binderChecklistFor('phlebotomy').map((d) => d.documentType)).toEqual(expect.arrayContaining([
      'cpr_card', 'immunizations', 'physical',
    ]));
    for (const program of ['barber-apprenticeship', 'esthetician-apprenticeship', 'phlebotomy']) {
      const types = binderChecklistFor(program).map((doc) => doc.documentType);
      expect(types).not.toContain('background_check');
      expect(types).not.toContain('drug_screen');
      expect(types).not.toContain('resume');
    }
  });
});

describe('escapeLikePattern', () => {
  it('escapes ilike wildcards in email addresses', async () => {
    const { escapeLikePattern } = await import('@/lib/admissions/on-application-submitted');
    expect(escapeLikePattern('a_b%c\\d@example.com')).toBe('a\\_b\\%c\\\\d@example.com');
  });
});
