/** Shared admissions response contract. Payment/application submission cannot grant LMS access. */
export const APPROVED_LEARNER_DASHBOARD_URL = 'https://app.elevateforhumanity.org/lms/dashboard';
export const PENDING_LEARNER_ACCESS_URL = 'https://app.elevateforhumanity.org/lms/access-pending';

const SAFE_EXTERNAL_NEXT_STEPS = new Set([
  APPROVED_LEARNER_DASHBOARD_URL,
  PENDING_LEARNER_ACCESS_URL,
  'https://app.elevateforhumanity.org/apprentice',
  'https://app.elevateforhumanity.org/learner/dashboard',
]);

export function paidApplicationStatusForUrl(nextStepUrl: string): 'enrolled' | 'pending_approval' {
  return nextStepUrl === APPROVED_LEARNER_DASHBOARD_URL ? 'enrolled' : 'pending_approval';
}

export function safeStudentApplicationNextStep(candidate: unknown, fallback: string): string {
  if (typeof candidate !== 'string') return fallback;
  if (SAFE_EXTERNAL_NEXT_STEPS.has(candidate)) return candidate;
  // Only same-origin relative routes or exact known external app destinations.
  // Reject protocol-relative URLs and encoded slash/backslash redirect ambiguity.
  if (candidate.startsWith('/') && !candidate.startsWith('//') &&
      !candidate.includes('\\') && !/%2f|%5c/i.test(candidate)) return candidate;
  return fallback;
}

export function isExternalStudentApplicationNextStep(value: string): boolean {
  return SAFE_EXTERNAL_NEXT_STEPS.has(value);
}
