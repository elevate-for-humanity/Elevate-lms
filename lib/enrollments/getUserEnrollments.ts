/**
 * Unified enrollment resolver for dashboards
 * Queries all enrollment tables and returns normalized objects
 * Used by student-portal and other dashboards to render "Continue Learning" links
 */

import { createClient } from '@/lib/supabase/server';
import { resolveDeliveryMode, getContinueLearningUrl, DeliveryMode, EnrollmentSource } from '@/lib/delivery/resolveDeliveryMode';

export type NormalizedEnrollment = {
  source_table: EnrollmentSource;
  enrollment_id: string;
  user_key: string;
  program_id: string | null;
  program_slug: string | null;
  program_title: string | null;
  course_id: string | null;
  course_title: string | null;
  provider_id: string | null;
  provider_name: string | null;
  status: string;
  progress: number;
  delivery_mode: DeliveryMode;
  inferred_delivery_mode: boolean;
  continue_url: string;
  created_at: string;
  updated_at: string | null;
};

export type EnrollmentQueryResult = {
  enrollments: NormalizedEnrollment[];
  error: string | null;
};

/**
 * Get all enrollments for a user across all enrollment tables
 * Returns normalized array sorted by most recent first
 */
export async function getUserEnrollments(userId: string): Promise<EnrollmentQueryResult> {
  const supabase = await createClient();
  
  if (!supabase) {
    return { enrollments: [], error: 'Database not configured' };
  }

  const results: NormalizedEnrollment[] = [];

  // Query training_enrollments directly (bypasses VIEW permission issues)
  const { data: enrollments } = await supabase
    .from('training_enrollments')
    .select(`
      id, user_id, course_id, program_id, status, progress, created_at, updated_at,
      course:training_courses (id, course_name, description)
    `)
    .eq('user_id', userId);

  if (enrollments) {
    // Fetch programs separately if program_ids exist
    const programIds = enrollments.map(e => e.program_id).filter(Boolean);
    let programMap: Record<string, any> = {};
    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name, slug, delivery_mode')
        .in('id', programIds);
      if (programs) {
        for (const p of programs) programMap[p.id] = p;
      }
    }

    for (const e of enrollments) {
      const program = e.program_id ? programMap[e.program_id] : null;
      const course = e.course as any;
      const { mode, inferred } = resolveDeliveryMode('enrollments', program);
      
      const enrollment: NormalizedEnrollment = {
        source_table: 'enrollments',
        enrollment_id: e.id,
        user_key: e.user_id,
        program_id: e.program_id,
        program_slug: program?.slug || null,
        program_title: program?.name || null,
        course_id: e.course_id,
        course_title: course?.course_name || null,
        provider_id: null,
        provider_name: null,
        status: e.status || 'active',
        progress: e.progress || 0,
        delivery_mode: mode,
        inferred_delivery_mode: inferred,
        continue_url: '',
        created_at: e.created_at,
        updated_at: e.updated_at,
      };
      enrollment.continue_url = getContinueLearningUrl(mode, enrollment);
      results.push(enrollment);
    }
  }

  // Query partner_lms_enrollments table (external providers)
  const { data: partnerEnrollments } = await supabase
    .from('partner_lms_enrollments')
    .select(`
      id, student_id, course_name, status, progress, created_at, updated_at,
      partner_lms_courses (id, title, slug),
      partner_lms_providers (id, name, portal_url)
    `)
    .eq('student_id', userId);

  if (partnerEnrollments) {
    for (const e of partnerEnrollments) {
      const course = e.partner_lms_courses as any;
      const provider = e.partner_lms_providers as any;
      const { mode, inferred } = resolveDeliveryMode('partner_lms_enrollments', null);
      
      const enrollment: NormalizedEnrollment = {
        source_table: 'partner_lms_enrollments',
        enrollment_id: e.id,
        user_key: e.student_id,
        program_id: null,
        program_slug: course?.slug || null,
        program_title: course?.title || e.course_name || null,
        course_id: course?.id || null,
        course_title: course?.title || e.course_name || null,
        provider_id: provider?.id || null,
        provider_name: provider?.name || null,
        status: e.status || 'active',
        progress: e.progress || 0,
        delivery_mode: mode,
        inferred_delivery_mode: inferred,
        continue_url: '',
        created_at: e.created_at,
        updated_at: e.updated_at,
      };
      enrollment.continue_url = getContinueLearningUrl(mode, enrollment);
      results.push(enrollment);
    }
  }

  // Query student_enrollments table (barber apprenticeship / hybrid)
  const { data: studentEnrollments } = await supabase
    .from('student_enrollments')
    .select('id, student_id, program_slug, status, progress, created_at, updated_at')
    .eq('student_id', userId);

  if (studentEnrollments) {
    for (const e of studentEnrollments) {
      const { mode, inferred } = resolveDeliveryMode('student_enrollments', null);
      
      const enrollment: NormalizedEnrollment = {
        source_table: 'student_enrollments',
        enrollment_id: e.id,
        user_key: e.student_id,
        program_id: null,
        program_slug: e.program_slug,
        program_title: e.program_slug ? formatProgramSlug(e.program_slug) : null,
        course_id: null,
        course_title: null,
        provider_id: null,
        provider_name: null,
        status: e.status || 'active',
        progress: e.progress || 0,
        delivery_mode: mode,
        inferred_delivery_mode: inferred,
        continue_url: '',
        created_at: e.created_at,
        updated_at: e.updated_at,
      };
      enrollment.continue_url = getContinueLearningUrl(mode, enrollment);
      results.push(enrollment);
    }
  }

  // Sort by created_at descending (most recent first)
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return { enrollments: results, error: null };
}

/**
 * Format program slug to title case
 */
function formatProgramSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get active enrollments only (filters out completed/cancelled)
 */
export async function getActiveEnrollments(userId: string): Promise<EnrollmentQueryResult> {
  const result = await getUserEnrollments(userId);
  
  if (result.error) {
    return result;
  }

  const activeStatuses = ['active', 'enrolled', 'in_progress', 'pending'];
  const activeEnrollments = result.enrollments.filter(e => 
    activeStatuses.includes(e.status.toLowerCase())
  );

  return { enrollments: activeEnrollments, error: null };
}
