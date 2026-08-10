import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  type ValidEnrollmentState,
  getEnrollmentRoute,
  normalizeEnrollmentState,
} from '@/lib/enrollment/enrollment-flow';

export type EnrollmentState = ValidEnrollmentState;

export interface EnrollmentGateResult {
  state: EnrollmentState;
  programSlug: string;
  nextAction: {
    label: string;
    href: string;
  };
}

/**
 * Resolve the next learner action from verified milestone timestamps.
 * `enrollment_state` is intentionally not reimplemented here; its DB-valid
 * values and legacy normalization live in enrollment-flow.ts.
 */
export function getNextRequiredAction(enrollment: {
  enrollment_state?: string | null;
  orientation_completed_at: string | null;
  documents_submitted_at: string | null;
  program_slug?: string;
}): { label: string; href: string; description: string } {
  const programSlug = enrollment.program_slug || 'barber-apprenticeship';

  if (!enrollment.orientation_completed_at) {
    return {
      label: 'Complete Orientation',
      href: `/programs/${programSlug}/orientation`,
      description: 'Complete the required program orientation to continue.',
    };
  }

  if (!enrollment.documents_submitted_at) {
    return {
      label: 'Submit Required Documents',
      href: `/programs/${programSlug}/documents`,
      description: 'Upload the required enrollment documents to continue.',
    };
  }

  const normalized = normalizeEnrollmentState(enrollment.enrollment_state);
  if (normalized && normalized !== 'active') {
    return {
      label: 'Continue Enrollment',
      href: getEnrollmentRoute(normalized),
      description: 'Complete the remaining enrollment requirement before course access is activated.',
    };
  }

  const courseId = resolveCourseId(programSlug);
  if (courseId) {
    return {
      label: 'Begin Your Program',
      href: `/lms/courses/${courseId}`,
      description: 'Open your assigned training program and continue your coursework.',
    };
  }

  const portalPath = SLUG_TO_PORTAL[programSlug];
  if (portalPath) {
    return {
      label: 'Go to Your Dashboard',
      href: portalPath,
      description: 'Track hours, documents, and apprenticeship progress.',
    };
  }

  return {
    label: 'View Programs',
    href: '/programs',
    description: 'Review available training programs.',
  };
}

/**
 * Gate access to apprentice dashboard.
 * Orientation and required documents are checked from the enrollment row,
 * while the canonical state machine controls whether the enrollment can enter LMS.
 */
export async function gateApprenticeDashboard(): Promise<{
  allowed: boolean;
  enrollment: unknown;
  nextAction: { label: string; href: string; description: string } | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/apprentice');

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*, programs(slug, title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) redirect('/programs');

  const programSlug = enrollment.programs?.slug || enrollment.program_slug || 'barber-apprenticeship';
  const nextAction = getNextRequiredAction({
    enrollment_state: enrollment.enrollment_state,
    orientation_completed_at: enrollment.orientation_completed_at,
    documents_submitted_at: enrollment.documents_submitted_at,
    program_slug: programSlug,
  });

  if (!enrollment.orientation_completed_at || !enrollment.documents_submitted_at) {
    redirect(nextAction.href);
  }

  const normalized = normalizeEnrollmentState(enrollment.enrollment_state);
  if (normalized && normalized !== 'active') {
    redirect(getEnrollmentRoute(normalized));
  }

  return { allowed: true, enrollment, nextAction };
}

/**
 * Compatibility export for code that renders state labels. Every key is a
 * value accepted by the live program_enrollments CHECK constraint.
 */
export const ENROLLMENT_STATES: Record<
  ValidEnrollmentState,
  { next: ValidEnrollmentState | null; canAccess: string[] }
> = {
  applied: { next: 'onboarding', canAccess: [] },
  waitlisted: { next: 'onboarding', canAccess: [] },
  onboarding: { next: 'orientation', canAccess: ['enrollment-success', 'orientation'] },
  orientation: { next: 'enrolled', canAccess: ['orientation', 'documents'] },
  enrolled: { next: 'active', canAccess: ['documents'] },
  active: { next: null, canAccess: ['dashboard', 'courses', 'hours', 'documents'] },
  pending_funding_verification: { next: 'onboarding', canAccess: ['enrollment-success'] },
  payment_required: { next: 'onboarding', canAccess: ['enrollment-success'] },
  suspended: { next: null, canAccess: [] },
  revoked: { next: null, canAccess: [] },
  withdrawn: { next: null, canAccess: [] },
  completed: { next: null, canAccess: ['records'] },
  graduated: { next: null, canAccess: ['records'] },
  placed: { next: null, canAccess: ['records'] },
  follow_up_6mo: { next: null, canAccess: ['records'] },
  follow_up_12mo: { next: null, canAccess: ['records'] },
};

const SLUG_TO_COURSE: Record<string, string> = {
  'barber-apprenticeship': 'barber-apprenticeship',
};

const SLUG_TO_PORTAL: Record<string, string> = {
  'barber-apprenticeship': '/apprentice',
};

function resolveCourseId(programSlug: string): string | null {
  return SLUG_TO_COURSE[programSlug] ?? null;
}
