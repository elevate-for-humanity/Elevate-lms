import { describe, expect, it } from 'vitest';
import {
  getIndianaPracticalEvidenceRequirement,
  validatePracticalEvidence,
} from '@/lib/apprenticeship/state-practical-evidence';

describe('Indiana practical evidence enforcement', () => {
  it('classifies physical services as evidence-bearing', () => {
    expect(getIndianaPracticalEvidenceRequirement({
      category: 'Trim client hair',
      description: 'Cut hair using clippers and scissors.',
    }).required).toBe(true);
  });

  it('does not force a patron/mannequin record onto administrative competencies', () => {
    expect(getIndianaPracticalEvidenceRequirement({
      category: 'Maintain financial records',
      description: 'Record services and payments.',
    }).required).toBe(false);
  });

  it('requires subject, evidence, date, and license for practical approval', () => {
    const result = validatePracticalEvidence({ required: true });
    expect(result.valid).toBe(false);
    expect(result.missing).toContain('Verifier license number');
  });

  it('accepts a complete practical evidence packet', () => {
    expect(validatePracticalEvidence({
      required: true,
      performanceSubject: 'patron',
      evidenceUrl: 'https://example.org/evidence/123',
      performedAt: '2026-08-26',
      instructorLicenseNumber: 'IN-12345',
    }).valid).toBe(true);
  });
});
