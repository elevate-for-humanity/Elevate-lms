import { describe, expect, it } from 'vitest';
import { binderChecklistFor, requiresClinicalDocuments } from '@/lib/admissions/on-application-submitted';

describe('admissions binder checklist', () => {
  it('uses the base checklist for general programs', () => {
    expect(binderChecklistFor('it-help-desk').map((d) => d.documentType)).toEqual([
      'government_id', 'ssn_card', 'hs_diploma_or_ged', 'resume', 'income_verification', 'proof_of_residency',
    ]);
  });

  it('adds clinical documents for healthcare and apprenticeship programs', () => {
    expect(requiresClinicalDocuments('medical-assistant')).toBe(true);
    expect(requiresClinicalDocuments('barber-apprenticeship')).toBe(true);
    expect(requiresClinicalDocuments('hvac-technician')).toBe(false);
    expect(binderChecklistFor('phlebotomy').map((d) => d.documentType)).toEqual(expect.arrayContaining([
      'cpr_card', 'immunizations', 'physical', 'background_check', 'drug_screen',
    ]));
  });
});
