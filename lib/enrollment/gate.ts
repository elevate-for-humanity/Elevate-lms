import { createClient } from '@/lib/supabase/server';
import { resolveCourseIdFromDb } from '@/lib/course-builder/program-resolver';
import { portalPathForProgramSlug, isApprenticeshipSlug } from '@/lib/portal/apprenticeship-portal-paths';
import { redirect } from 'next/navigation';

export type EnrollmentState =
  | 'applied'
  | 'approved'
  | 'paid'
  | 'confirmed'
  | 'orientation_complete'
  | 'documents_complete'
  | 'active';

export interface EnrollmentGateResult {
  state: EnrollmentState;
  programSlug: string;
  nextAction: {
    label: string;
    href: string;
  };
}

/**
 * Get the next required action for an enrollment
 * Priority: Orientation > Documents > First Course > Placement
 */
export function getNextRequiredAction(enrollment: {
  status: string;
  orientation_completed_at: string | null;
  documents_submitted_at: string | null;
  program_slug?: string;
  course_id?: string | null;
}): { label: string; href: string; description: string } {
  const programSlug = enrollment.program_slug;
  if (!programSlug) {
    return {
      label: 'View Programs',
      href: '/programs',
      description: 'Your enrollment needs a valid program assignment',
    };
  }

  // 1. Orientation not complete
  if (!enrollment.orientation_completed_at) {
    return {
      label: 'Complete Orientation',
      href: `/programs/${programSlug}/orientation`,
      description: 'Complete your mandatory orientation to continue',
    };
  }

  // 2. Documents not submitted
  if (!enrollment.documents_submitted_at) {
    return {
      label: 'Submit Required Documents',
      href: `/programs/${programSlug}/documents`,
      description: 'Upload your required documents to access your program',
    };
  }

  const courseId = enrollment.course_id;
  if (courseId) {
    return {
      label: 'Begin Your Program',
      href: `/lms/courses/${courseId}`,
      description: 'Open your training program and start the first lesson',
    };
  }

  const portalPath = portalPathForProgramSlug(programSlug);
  if (portalPath) {
    return {
      label: 'Go to Your Dashboard',
      href: portalPath,
      description: 'Track hours, documents, and apprenticeship progress',
    };
  }

  return {
    label: 'Go to Your Dashboard',
    href: '/lms/dashboard',
    description: 'Track your enrolled program progress and training milestones',
  };
}

/**
 * Gate access to apprentice dashboard
 * Redirects to required step if not complete
 */
export async function gateApprenticeDashboard(targetProgramSlug?: string): Promise<{
  allowed: boolean;
  enrollment: unknown;
  nextAction: { label: string; href: string; description: string } | null;
}> {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?redirect=/apprentice');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  // Get active enrollment (supporting user_id or student_id)
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('*, programs:program_id(slug, title, name)')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!enrollments || enrollments.length === 0) {
    // No enrollment - redirect to programs
    redirect('/programs');
  }

  // If a target program is requested, find it; otherwise find an active apprenticeship or active enrollment
  let enrollment = targetProgramSlug
    ? enrollments.find((e: any) => {
        const slug = e.programs?.slug || e.program_slug;
        return slug?.toLowerCase() === targetProgramSlug.toLowerCase();
      })
    : undefined;

  if (!enrollment) {
    // Prioritize active apprenticeship program enrollment
    enrollment = enrollments.find((e: any) => {
      const slug = e.programs?.slug || e.program_slug;
      const status = String(e.enrollment_state || e.status || '').toLowerCase();
      const isActive = ['active', 'enrolled', 'in_progress', 'confirmed'].includes(status);
      return isActive && isApprenticeshipSlug(slug);
    });
  }

  if (!enrollment) {
    // Fall back to any active enrollment or latest enrollment
    enrollment = enrollments.find((e: any) => {
      const status = String(e.enrollment_state || e.status || '').toLowerCase();
      return ['active', 'enrolled', 'in_progress', 'confirmed'].includes(status);
    }) || enrollments[0];
  }

  let programSlug = enrollment.programs?.slug || enrollment.program_slug;
  if (!programSlug && enrollment.program_id) {
    const { data: prog } = await supabase
      .from('programs')
      .select('slug')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    programSlug = prog?.slug;
  }

  if (!programSlug) {
    redirect('/programs');
  }

  // Non-apprenticeship programs belong on the LMS dashboard
  if (!isApprenticeshipSlug(programSlug)) {
    redirect('/lms/dashboard');
  }

  const courseId = await resolveCourseIdFromDb(supabase, programSlug);
  const nextAction = getNextRequiredAction({
    status: enrollment.status,
    orientation_completed_at: enrollment.orientation_completed_at,
    documents_submitted_at: enrollment.documents_submitted_at,
    program_slug: programSlug,
    course_id: courseId,
  });

  // If orientation or documents not complete, redirect
  if (!enrollment.orientation_completed_at) {
    redirect(nextAction.href);
  }

  if (!enrollment.documents_submitted_at) {
    redirect(nextAction.href);
  }

  return {
    allowed: true,
    enrollment,
    nextAction,
  };
}

/**
 * Enrollment state machine transitions
 */
export const ENROLLMENT_STATES: Record<
  EnrollmentState,
  {
    next: EnrollmentState | null;
    canAccess: string[];
  }
> = {
  applied: {
    next: 'approved',
    canAccess: [],
  },
  approved: {
    next: 'paid',
    canAccess: [],
  },
  paid: {
    next: 'confirmed',
    canAccess: ['enrollment-success'],
  },
  confirmed: {
    next: 'orientation_complete',
    canAccess: ['enrollment-success', 'orientation'],
  },
  orientation_complete: {
    next: 'documents_complete',
    canAccess: ['documents'],
  },
  documents_complete: {
    next: 'active',
    canAccess: ['dashboard'],
  },
  active: {
    next: null,
    canAccess: ['dashboard', 'courses', 'hours', 'documents'],
  },
};
