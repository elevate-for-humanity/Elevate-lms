/**
 * Enrollment state machine helpers.
 * Drives the /api/enrollment/next-action route.
 */

export type EnrollmentState =
  | 'applied'
  | 'waitlist'
  | 'approved'
  | 'onboarding'
  | 'payment_required'
  | 'pending_funding_verification'
  | 'enrolled'
  | 'active'
  | 'revoked'
  | string; // allow unknown states gracefully

export type EnrollmentAction =
  | 'complete_application'
  | 'wait_for_approval'
  | 'complete_onboarding'
  | 'complete_payment'
  | 'wait_for_funding_verification'
  | 'start_learning'
  | 'contact_support'
  | null;

export function getNextRequiredAction(state: EnrollmentState): EnrollmentAction {
  switch (state) {
    case 'applied':
      return 'wait_for_approval';
    case 'waitlist':
      return 'wait_for_approval';
    case 'approved':
      return 'complete_onboarding';
    case 'onboarding':
      return 'complete_onboarding';
    case 'payment_required':
      return 'complete_payment';
    case 'pending_funding_verification':
      return 'wait_for_funding_verification';
    case 'enrolled':
    case 'active':
      return 'start_learning';
    case 'revoked':
      return 'contact_support';
    default:
      return null;
  }
}

export function getActionRoute(action: EnrollmentAction, programSlug?: string | null): string | null {
  const slug = programSlug ?? '';
  switch (action) {
    case 'complete_application':
      return slug ? `/apply/${slug}` : '/apply';
    case 'wait_for_approval':
      return '/lms/dashboard';
    case 'complete_onboarding':
      return '/lms/onboarding';
    case 'complete_payment':
      return slug ? `/apply/${slug}/payment` : '/lms/dashboard';
    case 'wait_for_funding_verification':
      return '/lms/dashboard';
    case 'start_learning':
      return '/lms/dashboard';
    case 'contact_support':
      return '/contact';
    default:
      return null;
  }
}

export function getActionCTA(action: EnrollmentAction): string {
  switch (action) {
    case 'complete_application':
      return 'Complete Application';
    case 'wait_for_approval':
      return 'Check Status';
    case 'complete_onboarding':
      return 'Continue Onboarding';
    case 'complete_payment':
      return 'Complete Payment';
    case 'wait_for_funding_verification':
      return 'Check Status';
    case 'start_learning':
      return 'Go to Dashboard';
    case 'contact_support':
      return 'Contact Support';
    default:
      return 'View Dashboard';
  }
}

export function getActionDescription(action: EnrollmentAction): string {
  switch (action) {
    case 'complete_application':
      return 'Finish your application to continue.';
    case 'wait_for_approval':
      return 'Your application is under review. We\'ll notify you when it\'s approved.';
    case 'complete_onboarding':
      return 'Complete your onboarding steps to get started.';
    case 'complete_payment':
      return 'A payment is required to activate your enrollment.';
    case 'wait_for_funding_verification':
      return 'Your funding is being verified. This usually takes 1–3 business days.';
    case 'start_learning':
      return 'You\'re enrolled and ready to start learning.';
    case 'contact_support':
      return 'Your enrollment has been revoked. Please contact support for assistance.';
    default:
      return 'Visit your dashboard for more information.';
  }
}
