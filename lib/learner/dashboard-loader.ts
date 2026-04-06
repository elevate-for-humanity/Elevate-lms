/**
 * Learner dashboard data loader.
 *
 * All queries are anchored to the authenticated user's ID — never to a
 * client-supplied parameter. Required queries throw on failure so the
 * page renders an explicit error instead of silent empty state.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';

const ACCESS_STATES = [
  'active', 'in_progress', 'enrolled', 'confirmed', 'pending_funding_verification',
];

export async function loadLearnerDashboard() {
  // ── 1. IDENTITY ────────────────────────────────────────────────────
  // requireRole throws and redirects if unauthenticated or wrong role.
  // user.id is the only identity source used below — never params/props.
  const { user, profile } = await requireRole(['student', 'admin', 'super_admin']);

  const supabase = await createClient();

  // ── 2. ENROLLMENTS (required) ──────────────────────────────────────
  const { data: programEnrollments, error: enrollmentError } = await supabase
    .from('program_enrollments')
    .select(`
      id,
      course_id,
      program_id,
      program_slug,
      status,
      enrollment_state,
      progress,
      progress_percent,
      enrolled_at,
      access_granted_at,
      courses (
        id,
        title,
        description,
        duration_hours
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (enrollmentError) {
    logger.error('loadLearnerDashboard: enrollments query failed', enrollmentError);
    throw new Error('ENROLLMENTS_LOAD_FAILED');
  }

  // ── 3. TRAINING ENROLLMENTS (legacy, optional) ─────────────────────
  const { data: trainingEnrollments, error: trainingError } = await supabase
    .from('training_enrollments')
    .select(`
      id,
      course_id,
      status,
      progress,
      enrolled_at,
      training_courses (
        id,
        course_name,
        description,
        duration_hours
      )
    `)
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (trainingError) {
    logger.error('loadLearnerDashboard: training_enrollments query failed', trainingError);
    // Non-fatal — legacy table, continue with empty
  }

  // ── 4. APPRENTICESHIP PROGRAM NAMES (optional) ────────────────────
  const programIds = (programEnrollments ?? [])
    .filter((e) => !e.course_id && e.program_id)
    .map((e) => e.program_id as string);

  const { data: apprenticeshipPrograms } = programIds.length > 0
    ? await supabase
        .from('apprenticeship_programs')
        .select('id, name, slug, description')
        .in('id', programIds)
    : { data: [] };

  // ── 5. NORMALIZE + MERGE ENROLLMENTS ──────────────────────────────
  const apMap = new Map((apprenticeshipPrograms ?? []).map((p: any) => [p.id, p]));

  const normalizedLegacy = (programEnrollments ?? []).map((e: any) => {
    if (!e.courses && !e.course_id && e.program_id && apMap.has(e.program_id)) {
      const ap = apMap.get(e.program_id);
      return {
        ...e,
        courses: {
          id: ap.id,
          title: ap.name,
          description: ap.description ?? 'Registered Apprenticeship Program',
          duration_hours: null,
        },
        _isApprenticeship: true,
      };
    }
    return e;
  });

  const normalizedTraining = (trainingEnrollments ?? []).map((te: any) => ({
    ...te,
    courses: te.training_courses
      ? {
          id: te.training_courses.id,
          title: te.training_courses.course_name,
          description: te.training_courses.description,
          duration_hours: te.training_courses.duration_hours,
        }
      : null,
  }));

  const seen = new Set<string>();
  const enrollments = [...normalizedLegacy, ...normalizedTraining].filter((e: any) => {
    const key = e.course_id ?? e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 6. LESSON PROGRESS (required if enrolled) ─────────────────────
  const courseIds = enrollments.map((e: any) => e.course_id).filter(Boolean) as string[];

  const { data: lessonProgress, error: progressError } = courseIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id, completed')
        .eq('user_id', user.id)
        .in('course_id', courseIds)
    : { data: [], error: null };

  if (progressError) {
    logger.error('loadLearnerDashboard: lesson_progress query failed', progressError);
    throw new Error('PROGRESS_LOAD_FAILED');
  }

  // ── 7. CERTIFICATES (optional) ────────────────────────────────────
  // Use explicit eq filters — no string interpolation in .or()
  const { data: certsByUserId } = await supabase
    .from('certificates')
    .select('id, certificate_number, course_title, issued_at, verification_code')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(5);

  const { data: certsByStudentId } = await supabase
    .from('certificates')
    .select('id, certificate_number, course_title, issued_at, verification_code')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false })
    .limit(5);

  // Merge and dedup by id
  const certSeen = new Set<string>();
  const certificates = [...(certsByUserId ?? []), ...(certsByStudentId ?? [])].filter((c) => {
    if (certSeen.has(c.id)) return false;
    certSeen.add(c.id);
    return true;
  });

  // ── 8. NOTIFICATIONS (optional) ───────────────────────────────────
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, created_at, read')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  // ── 9. ACHIEVEMENTS (optional) ────────────────────────────────────
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select(`
      id,
      earned_at,
      achievements (
        id,
        name,
        description,
        icon
      )
    `)
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(5);

  // ── 10. CERTIFICATION REQUESTS (optional) ─────────────────────────
  const { data: certRequests } = await supabase
    .from('certification_requests')
    .select(`
      id, status, authorization_code, authorization_expires_at,
      certificate_issued_at, created_at,
      programs ( title ),
      credential_registry ( name, abbreviation ),
      program_certification_pathways (
        credential_name, credential_abbreviation,
        eligibility_review_required, application_url,
        fee_payer, exam_fee_cents,
        certification_bodies ( name, website )
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'pending_completion')
    .order('created_at', { ascending: false })
    .limit(5);

  // ── 11. TRAINING HOURS (optional) ─────────────────────────────────
  const activeEnrollmentId = enrollments.find((e: any) =>
    ACCESS_STATES.includes(e.status ?? '') || ACCESS_STATES.includes(e.enrollment_state ?? '')
  )?.id ?? null;

  const { data: attendanceData } = activeEnrollmentId
    ? await supabase
        .from('attendance_hours')
        .select('hours_logged, date, type')
        .eq('enrollment_id', activeEnrollmentId)
        .order('date', { ascending: false })
        .limit(30)
    : { data: [] };

  const { data: hoursData } = await supabase
    .from('hour_entries')
    .select('hours_claimed')
    .eq('user_id', user.id);

  const attendanceHours = (attendanceData ?? []).reduce(
    (sum: number, a: any) => sum + (a.hours_logged ?? 0), 0
  );
  const trainingHours = (hoursData ?? []).reduce(
    (sum: number, h: any) => sum + (Number(h.hours_claimed) ?? 0), 0
  );
  const totalHours = attendanceHours || trainingHours;

  // ── 12. MESSAGES (optional) ───────────────────────────────────────
  const { data: recentMessages } = await supabase
    .from('messages')
    .select('id, subject, body, created_at, sender_id, read')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(3);

  // ── 13. SCHEDULE — scoped to student's cohort only ─────────────────
  // cohort_sessions has no user_id — join via training_enrollments.cohort_id
  const cohortIds = (trainingEnrollments ?? [])
    .map((e: any) => e.cohort_id)
    .filter(Boolean) as string[];

  const { data: upcomingSchedule } = cohortIds.length > 0
    ? await supabase
        .from('cohort_sessions')
        .select('id, title, session_date, start_time, end_time, location, session_type')
        .in('cohort_id', cohortIds)
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .limit(3)
    : { data: [] };

  // ── 14. WORKONE APPLICATION (optional) ────────────────────────────
  const { data: workoneApp } = await supabase
    .from('applications')
    .select('id, status, requested_funding_source')
    .eq('user_id', user.id)
    .eq('status', 'pending_workone')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── 15. EXTERNAL ENROLLMENTS (optional) ───────────────────────────
  const { data: externalEnrollments } = await supabase
    .from('external_program_enrollments')
    .select('id, program_slug, enrollment_state, start_date, notes, created_at')
    .eq('user_id', user.id)
    .eq('enrollment_state', 'active')
    .order('created_at', { ascending: false });

  // ── 16. PENDING ONBOARDING (optional) ─────────────────────────────
  const { data: pendingOnboarding } = await supabase
    .from('program_enrollments')
    .select('id, enrollment_state, next_required_action, full_name, program_id')
    .eq('user_id', user.id)
    .in('enrollment_state', ['applied', 'approved', 'confirmed', 'orientation_complete', 'documents_complete'])
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // ── 17. DERIVED STATS ─────────────────────────────────────────────
  const activeEnrollments = enrollments.filter((e: any) =>
    ACCESS_STATES.includes(e.status ?? '') || ACCESS_STATES.includes(e.enrollment_state ?? '')
  );
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');
  const averageProgress =
    activeEnrollments.length > 0
      ? Math.round(
          activeEnrollments.reduce((sum: number, e: any) => sum + (e.progress_percent ?? e.progress ?? 0), 0) /
            activeEnrollments.length
        )
      : 0;

  return {
    user,
    profile,
    enrollments,
    activeEnrollments,
    completedEnrollments,
    averageProgress,
    lessonProgress: lessonProgress ?? [],
    certificates,
    notifications: notifications ?? [],
    achievements: achievements ?? [],
    certRequests: certRequests ?? [],
    totalHours,
    recentMessages: recentMessages ?? [],
    upcomingSchedule: upcomingSchedule ?? [],
    workoneApp,
    externalEnrollments: externalEnrollments ?? [],
    pendingOnboarding,
    // Onboarding gate flags
    onboardingDone: !!profile?.onboarding_completed,
    accessGranted: !!(programEnrollments ?? []).find((e) => e.access_granted_at),
    latestEnrollment: (programEnrollments ?? [])[0] ?? null,
  };
}

export type LearnerDashboardData = Awaited<ReturnType<typeof loadLearnerDashboard>>;
