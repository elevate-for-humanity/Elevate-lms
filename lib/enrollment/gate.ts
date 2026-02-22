import { createClient } from '@/lib/supabase/server';
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
}): { label: string; href: string; description: string } {
  const programSlug = enrollment.program_slug || 'barber-apprenticeship';
  
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
  
  // 3. Start first course
  return {
    label: 'Begin Course 1',
    href: '/apprentice/courses/1',
    description: 'Start your first course module',
  };
}

/**
 * Gate access to apprentice dashboard
 * Redirects to required step if not complete
 */
export async function gateApprenticeDashboard(): Promise<{
  allowed: boolean;
  enrollment: unknown;
  nextAction: { label: string; href: string; description: string } | null;
}> {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?redirect=/apprentice');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  // Get active enrollment
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('*, programs(slug, name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!enrollment) {
    // No enrollment - redirect to programs
    redirect('/programs');
  }

  const nextAction = getNextRequiredAction({
    status: enrollment.status,
    orientation_completed_at: enrollment.orientation_completed_at,
    documents_submitted_at: enrollment.documents_submitted_at,
    program_slug: enrollment.programs?.slug,
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
export const ENROLLMENT_STATES: Record<EnrollmentState, {
  next: EnrollmentState | null;
  canAccess: string[];
}> = {
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
