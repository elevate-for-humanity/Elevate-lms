export type PracticalSubject = 'student' | 'patron' | 'mannequin';

export type PracticalEvidenceRequirement = {
  required: boolean;
  state: 'IN';
  authority: string;
  standardVersion: string;
  citation: string;
  reason: string;
};

const PRACTICAL_CATEGORY = /(trim|cut|shav|apply|clean|steriliz|disinfect|massage|wax|extraction|tint|manicur|pedicur|nail|skin|hair|protective covering|demonstrate activity|tool|equipment)/i;

export function getIndianaPracticalEvidenceRequirement(competency: {
  category?: string | null;
  description?: string | null;
}): PracticalEvidenceRequirement {
  const text = `${competency.category ?? ''} ${competency.description ?? ''}`;
  const required = PRACTICAL_CATEGORY.test(text);
  return {
    required,
    state: 'IN',
    authority: 'Indiana State Board of Cosmetology and Barber Examiners',
    standardVersion: '820 IAC effective 2026-07-22',
    citation: '820 IAC student progress report requirements',
    reason: required
      ? 'This competency describes a practical service, sanitation action, tool use, or physical demonstration.'
      : 'This competency may be verified through documented observation or other authorized evidence.',
  };
}

export function validatePracticalEvidence(input: {
  required: boolean;
  performanceSubject?: string | null;
  evidenceUrl?: string | null;
  performedAt?: string | null;
  instructorLicenseNumber?: string | null;
}) {
  const missing: string[] = [];
  if (!input.required) return { valid: true, missing };
  if (!['student', 'patron', 'mannequin'].includes(input.performanceSubject ?? '')) {
    missing.push('Performance subject (student, patron, or mannequin)');
  }
  if (!input.evidenceUrl?.trim()) missing.push('Photo, video, checklist, or observation evidence');
  if (!input.performedAt) missing.push('Performance date');
  if (!input.instructorLicenseNumber?.trim()) missing.push('Verifier license number');
  return { valid: missing.length === 0, missing };
}
