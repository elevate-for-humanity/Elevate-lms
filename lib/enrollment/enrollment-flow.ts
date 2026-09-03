/**
 * Canonical enrollment flow — DB-valid `enrollment_state` values only.
 *
 * Constraint source: supabase/migrations/20260501000010_enrollment_state_and_followup.sql
 *
 * Student self-serve path:
 *   applied / waitlisted / funding gates → confirm → orientation → documents → active (LMS)
 */

/** States allowed by the live DB CHECK constraint. */
export const VALID_ENROLLMENT_STATES = [
  'applied',
  'waitlisted',
  'onboarding',
  'orientation',
  'enrolled',
  'active',
  'pending_funding_verification',
  'payment_required',
  'suspended',
  'revoked',
  'withdrawn',
  'completed',
  'graduated',
  'placed',
  'follow_up_6mo',
  'follow_up_12mo',
] as const;

export type ValidEnrollmentState = (typeof VALID_ENROLLMENT_STATES)[number];

/** Legacy values still present in old rows — normalize on read. */
const LEGACY_STATE_MAP: Record<string, ValidEnrollmentState> = {
  approved: 'onboarding',
  confirmed: 'onboarding',
  orientation_complete: 'enrolled',
  documents_complete: 'active',
  paid: 'onboarding',
};

export function normalizeEnrollmentState(
  state: string | null | undefined,
): ValidEnrollmentState | null {
  if (!state) return null;
  if ((VALID_ENROLLMENT_STATES as readonly string[]).includes(state)) {
    return state as ValidEnrollmentState;
  }
  return LEGACY_STATE_MAP[state] ?? null;
}

/** States that grant /lms access (proxy gate). */
export const LMS_ACCESS_STATES: readonly ValidEnrollmentState[] = ['active'];

/** Terminal — student cannot proceed; show /unauthorized. */
export const TERMINAL_ENROLLMENT_STATES: readonly ValidEnrollmentState[] = [
  'suspended',
  'revoked',
  'withdrawn',
  'completed',
  'graduated',
  'placed',
  'follow_up_6mo',
  'follow_up_12mo',
];

/** Shown on learner dashboard onboarding banner. */
export const PENDING_ONBOARDING_STATES: readonly ValidEnrollmentState[] = [
  'applied',
  'waitlisted',
  'pending_funding_verification',
  'payment_required',
  'onboarding',
  'orientation',
  'enrolled',
];

/**
 * Enrollment states that route apprentices to the apprentice dashboard,
 * not the generic learner dashboard.
 * Includes in-progress onboarding and legacy DB values still on old rows.
 */
export const APPRENTICESHIP_PORTAL_ENROLLMENT_STATES = [
  ...PENDING_ONBOARDING_STATES,
  'active',
  // legacy values (see LEGACY_STATE_MAP) — may still exist on program_enrollments
  'confirmed',
  'orientation_complete',
  'documents_complete',
] as const;

/** States eligible for document submission APIs. */
export const PRE_DOCUMENTS_STATES: readonly ValidEnrollmentState[] = [
  'enrolled',
  'orientation',
  'onboarding',
];

/** Route for a student based on canonical enrollment_state. */
export function getEnrollmentRoute(state: string | null | undefined): string {
  const normalized = normalizeEnrollmentState(state);
  if (!normalized) return '/programs';

  if (LMS_ACCESS_STATES.includes(normalized)) {
    return '/learner/dashboard';
  }
  if (TERMINAL_ENROLLMENT_STATES.includes(normalized)) {
    return '/unauthorized';
  }

  switch (normalized) {
    case 'orientation':
      return '/enrollment/orientation';
    case 'enrolled':
      return '/enrollment/documents';
    case 'onboarding':
    case 'applied':
    case 'waitlisted':
    case 'pending_funding_verification':
    case 'payment_required':
      return '/enrollment/confirmed';
    default:
      return '/programs';
  }
}

export function hasLmsAccess(state: string | null | undefined): boolean {
  const normalized = normalizeEnrollmentState(state);
  return normalized !== null && LMS_ACCESS_STATES.includes(normalized);
}

export function isTerminalEnrollmentState(state: string | null | undefined): boolean {
  const normalized = normalizeEnrollmentState(state);
  return normalized !== null && TERMINAL_ENROLLMENT_STATES.includes(normalized);
}

export function canShowConfirmedPage(state: string | null | undefined): boolean {
  const normalized = normalizeEnrollmentState(state);
  if (!normalized) return false;
  return (
    normalized === 'onboarding' ||
    normalized === 'applied' ||
    normalized === 'waitlisted' ||
    normalized === 'pending_funding_verification' ||
    normalized === 'payment_required'
  );
}

export function canCompleteOrientation(state: string | null | undefined): boolean {
  const normalized = normalizeEnrollmentState(state);
  return normalized === 'orientation' || normalized === 'onboarding';
}

export function canSubmitDocuments(state: string | null | undefined): boolean {
  const normalized = normalizeEnrollmentState(state);
  return normalized === 'enrolled' || normalized === 'orientation';
}

export function getOnboardingBannerCopy(state: string | null | undefined): {
  message: string;
  href: string;
  cta: string;
} {
  const normalized = normalizeEnrollmentState(state) ?? 'applied';

  switch (normalized) {
    case 'applied':
    case 'waitlisted':
      return {
        message: "Your application is being reviewed. We'll notify you when it's approved.",
        href: '/enrollment/confirmed',
        cta: 'View Status',
      };
    case 'pending_funding_verification':
      return {
        message: 'Your funding is being verified. This usually takes 1–3 business days.',
        href: '/enrollment/confirmed',
        cta: 'View Status',
      };
    case 'payment_required':
      return {
        message: 'Complete payment to activate your enrollment.',
        href: '/enrollment/confirmed',
        cta: 'Complete Payment',
      };
    case 'onboarding':
      return {
        message: 'Confirm your enrollment to proceed to orientation.',
        href: '/enrollment/confirmed',
        cta: 'Confirm Enrollment',
      };
    case 'orientation':
      return {
        message: 'Complete your orientation to unlock document upload.',
        href: '/enrollment/orientation',
        cta: 'Start Orientation',
      };
    case 'enrolled':
      return {
        message: 'Upload your required documents to activate your enrollment.',
        href: '/enrollment/documents',
        cta: 'Upload Documents',
      };
    default:
      return {
        message: 'Complete your onboarding steps to access your program.',
        href: '/enrollment/confirmed',
        cta: 'Continue',
      };
  }
}
