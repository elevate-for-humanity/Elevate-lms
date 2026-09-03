/**
 * Learner dashboard data loader.
 *
 * Design principles:
 * - All queries are anchored to the authenticated user's ID — never to a
 *   client-supplied parameter.
 * - Required queries (enrollments, profile) throw on failure so the page
 *   renders an explicit error instead of silent empty state.
 * - Optional queries (notifications, achievements, schedule, etc.) fail
 *   gracefully: errors are logged and the field returns an empty array.
 *   A broken announcements widget must never white-screen the dashboard.
 * - No inferred FK joins. Every cross-table relationship is fetched
 *   separately and merged in application code. This survives schema
 *   migrations that drop or rename FK constraints.
 * - Column names validated against migrations. Drift notes inline.
 */

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { logger } from '@/lib/logger';

const ACCESS_STATES = [
  'active',
  'in_progress',
  'enrolled',
  'confirmed',
  'pending_funding_verification',
];

// ─── Typed DTOs ────────────────────────────────────────────────────────────────

export interface EnrollmentDTO {
  id: string;
  course_id: string | null;
  program_id: string | null;
  program_slug: string | null;
  status: string | null;
  enrollment_state: string | null;
  progress_percent: number | null;
  enrolled_at: string | null;
  access_granted_at: string | null;
  courses: {
    id: string;
    title: string;
    description: string | null;
    duration_hours: number | null;
  } | null;
  _isApprenticeship?: boolean;
}

export interface CertificateDTO {
  id: string;
  certificate_number: string | null;
  course_title: string | null;
  issued_at: string | null;
  verification_code: string | null;
}

export interface NotificationDTO {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

// announcements schema: id, title, body, severity, audience, published, expires_at
// No `content` column. No `is_active` column.
export interface AnnouncementDTO {
  id: string;
  title: string;
  body: string;
  severity: string;
  audience: string;
}

export interface AchievementDTO {
  id: string;
  earned_at: string | null;
  name: string | null;
  description: string | null;
  icon: string | null;
}

export interface CertRequestDTO {
  id: string;
  status: string;
  authorization_code: string | null;
  authorization_expires_at: string | null;
  certificate_issued_at: string | null;
  created_at: string;
  program_title: string | null;
  credential_name: string | null;
  credential_abbreviation: string | null;
}

// cohort_sessions columns: id, cohort_id, session_date, start_time, end_time,
// duration_minutes, modality, location, instructor_name, notes, created_at
// No `title` column. No `session_type` column.
export interface ScheduleSessionDTO {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  modality: string | null;
}

export interface MessageDTO {
  id: string;
  subject: string | null;
  body: string;
  created_at: string;
  sender_id: string | null;
  read: boolean;
}

export interface LearnerDashboardData {
  user: { id: string; email: string | undefined };
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role: string;
    avatar_url: string | null;
    onboarding_completed: boolean | null;
  };
  enrollments: EnrollmentDTO[];
  activeEnrollments: EnrollmentDTO[];
  completedEnrollments: EnrollmentDTO[];
  averageProgress: number;
  lessonProgress: Array<{
    course_id: string | null;
    lesson_id: string;
    completed: boolean;
  }>;
  certificates: CertificateDTO[];
  notifications: NotificationDTO[];
  announcements: AnnouncementDTO[];
  achievements: AchievementDTO[];
  certRequests: CertRequestDTO[];
  totalHours: number;
  attendanceHours: number;
  recentMessages: MessageDTO[];
  upcomingSchedule: ScheduleSessionDTO[];
  workoneApp: {
    id: string;
    status: string | null;
    program_id: string | null;
    program_slug: string | null;
    funding_type: string | null;
  } | null;
  externalEnrollments: Array<{
    id: string;
    program_slug: string | null;
    enrollment_state: string | null;
    start_date: string | null;
    notes: string | null;
    created_at: string;
  }>;
  pendingOnboarding: {
    id: string;
    enrollment_state: string | null;
    next_required_action: string | null;
    full_name: string | null;
    program_id: string | null;
    program_slug: string | null;
  } | null;
  applications: Array<{
    id: string;
    status: string | null;
    payment_status: string | null;
    program_id: string | null;
    program_slug: string | null;
    funding_type: string | null;
  }>;
  attendanceData: Array<{ hours_logged: number; date: string; type: string | null }>;
  onboardingDone: boolean;
  accessGranted: boolean;
  latestEnrollment: EnrollmentDTO | null;
  binder: { id: string; status: string; enrollment_id: string | null } | null;
  /** Non-fatal warnings from optional query failures — for diagnostics only. */
  warnings: string[];
}

// ─── Loader ────────────────────────────────────────────────────────────────────

export async function loadLearnerDashboard(): Promise<LearnerDashboardData> {
  const warnings: string[] = [];

  // ── 1. IDENTITY ────────────────────────────────────────────────────
  const { user, profile } = await requireRole(['student', 'admin', 'super_admin']);
  const supabase = await createClient();

  // ── 2. ENROLLMENTS (required) ──────────────────────────────────────
  const { data: programEnrollments, error: enrollmentError } = await supabase
    .from('program_enrollments')
    .select(
      `id, course_id, program_id, program_slug,
       status, enrollment_state, progress_percent,
       enrolled_at, access_granted_at, cohort_id`,
    )
    .eq('user_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (enrollmentError) {
    logger.error('loadLearnerDashboard: enrollments query failed', enrollmentError);
    throw new Error('ENROLLMENTS_LOAD_FAILED');
  }

  const rows = programEnrollments ?? [];

  // ── 3. COURSE DETAILS (manual join — no FK on program_enrollments.course_id) ──
  const enrollmentCourseIds = rows.map((e) => e.course_id).filter(Boolean) as string[];

  const { data: courseRows, error: courseErr } =
    enrollmentCourseIds.length > 0
      ? await supabase
          .from('courses')
          .select('id, title, description, duration_hours')
          .in('id', enrollmentCourseIds)
      : { data: [], error: null };

  if (courseErr) {
    warnings.push('courses lookup failed');
    logger.warn('loadLearnerDashboard: courses lookup failed', courseErr);
  }

  const courseMap = new Map<string, any>((courseRows ?? []).map((c: any) => [c.id, c]));

  // ── 4. TRAINING COURSE DETAILS (legacy, manual join) ───────────────
  const { data: trainingCourseRows, error: tcErr } =
    enrollmentCourseIds.length > 0
      ? await supabase
          .from('lms_courses')
          .select('id, course_name, description, duration_hours')
          .in('id', enrollmentCourseIds)
      : { data: [], error: null };

  if (tcErr) {
    warnings.push('training_courses lookup failed');
    logger.warn('loadLearnerDashboard: training_courses lookup failed', tcErr);
  }

  const trainingCourseMap = new Map<string, any>((trainingCourseRows ?? []).map((c: any) => [c.id, c]));

  // ── 5. APPRENTICESHIP PROGRAM NAMES (manual join) ──────────────────
  const programIds = rows
    .filter((e) => !e.course_id && e.program_id)
    .map((e) => e.program_id as string);

  const { data: apprenticeshipPrograms, error: apErr } =
    programIds.length > 0
      ? await supabase
          .from('apprenticeship_programs')
          .select('id, name, description')
          .in('id', programIds)
      : { data: [], error: null };

  if (apErr) {
    warnings.push('apprenticeship_programs lookup failed');
    logger.warn('loadLearnerDashboard: apprenticeship_programs lookup failed', apErr);
  }

  const apMap = new Map<string, any>((apprenticeshipPrograms ?? []).map((p: any) => [p.id, p]));

  // ── 6. NORMALIZE ENROLLMENTS ───────────────────────────────────────
  const normalizedEnrollments: EnrollmentDTO[] = rows.map((e: any) => {
    let courses: EnrollmentDTO['courses'] = null;

    if (e.course_id) {
      const course = courseMap.get(e.course_id) ?? trainingCourseMap.get(e.course_id);
      if (course) {
        courses = {
          id: course.id,
          title: course.title ?? course.course_name ?? 'Course',
          description: course.description ?? null,
          duration_hours: course.duration_hours ?? null,
        };
      }
    } else if (e.program_id && apMap.has(e.program_id)) {
      const ap = apMap.get(e.program_id);
      courses = {
        id: ap.id,
        title: ap.name ?? 'Apprenticeship Program',
        description: ap.description ?? null,
        duration_hours: null,
      };
      return { ...e, courses, _isApprenticeship: true } as EnrollmentDTO;
    }

    return { ...e, courses } as EnrollmentDTO;
  });

  const seen = new Set<string>();
  const enrollments = normalizedEnrollments.filter((e) => {
    const key = e.course_id ?? e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 7. LESSON PROGRESS ─────────────────────────────────────────────
  const courseIds = enrollments.map((e) => e.course_id).filter(Boolean) as string[];

  const { data: lessonProgressRows, error: progressError } =
    courseIds.length > 0
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

  // ── 8. CERTIFICATES (optional) ────────────────────────────────────
  const [certByUser, certByStudent] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, certificate_number, course_title, issued_at, verification_code')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(5),
    supabase
      .from('certificates')
      .select('id, certificate_number, course_title, issued_at, verification_code')
      .eq('student_id', user.id)
      .order('issued_at', { ascending: false })
      .limit(5),
  ]);

  if (certByUser.error) warnings.push('certificates(user_id) query failed');
  if (certByStudent.error) warnings.push('certificates(student_id) query failed');

  const certSeen = new Set<string>();
  const certificates: CertificateDTO[] = [
    ...(certByUser.data ?? []),
    ...(certByStudent.data ?? []),
  ].filter((c) => {
    if (certSeen.has(c.id)) return false;
    certSeen.add(c.id);
    return true;
  });

  // ── 9. NOTIFICATIONS (optional) ───────────────────────────────────
  const { data: notificationRows, error: notifErr } = await supabase
    .from('notifications')
    .select('id, title, message, created_at, read')
    .eq('user_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifErr) {
    warnings.push('notifications query failed');
    logger.warn('loadLearnerDashboard: notifications query failed', notifErr);
  }

  // ── 10. ANNOUNCEMENTS (optional) ──────────────────────────────────
  // Schema: announcements(id, title, body, severity, audience, published, expires_at)
  // No `is_active` column — filter on published=true and expiry.
  // No `content` column — `body` is correct.
  const { data: announcementRows, error: announcementErr } = await supabase
    .from('announcements')
    .select('id, title, body, severity, audience')
    .eq('published', true)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .in('audience', ['all', 'student'])
    .order('published_at', { ascending: false })
    .limit(5);

  if (announcementErr) {
    warnings.push('announcements query failed');
    logger.warn('loadLearnerDashboard: announcements query failed', announcementErr);
  }

  // ── 11. ACHIEVEMENTS (optional, manual join) ───────────────────────
  const { data: userAchievementRows, error: achieveErr } = await supabase
    .from('user_achievements')
    .select('id, achievement_id, earned_at')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })
    .limit(5);

  if (achieveErr) {
    warnings.push('user_achievements query failed');
    logger.warn('loadLearnerDashboard: user_achievements query failed', achieveErr);
  }

  const achievementIds = (userAchievementRows ?? [])
    .map((a: any) => a.achievement_id)
    .filter(Boolean) as string[];

  const { data: achievementDetails } =
    achievementIds.length > 0
      ? await supabase
          .from('achievements')
          .select('id, name, description, icon')
          .in('id', achievementIds)
      : { data: [] };

  const achievementDetailMap = new Map<string, any>(
    (achievementDetails ?? []).map((a: any) => [a.id, a]),
  );

  const achievements: AchievementDTO[] = (userAchievementRows ?? []).map((ua: any) => {
    const detail = achievementDetailMap.get(ua.achievement_id);
    return {
      id: ua.id,
      earned_at: ua.earned_at ?? null,
      name: detail?.name ?? null,
      description: detail?.description ?? null,
      icon: detail?.icon ?? null,
    };
  });

  // ── 12. CERTIFICATION REQUESTS (optional) ─────────────────────────
  // FK joins to programs and credential_registry are valid per schema.
  const { data: certRequestRows, error: certReqErr } = await supabase
    .from('certification_requests')
    .select(
      `id, status, authorization_code, authorization_expires_at,
       certificate_issued_at, created_at,
       programs ( title ),
       credential_registry ( name, abbreviation )`,
    )
    .eq('user_id', user.id)
    .neq('status', 'pending_completion')
    .order('created_at', { ascending: false })
    .limit(5);

  if (certReqErr) {
    warnings.push('certification_requests query failed');
    logger.warn('loadLearnerDashboard: certification_requests query failed', certReqErr);
  }

  const certRequests: CertRequestDTO[] = (certRequestRows ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    authorization_code: r.authorization_code ?? null,
    authorization_expires_at: r.authorization_expires_at ?? null,
    certificate_issued_at: r.certificate_issued_at ?? null,
    created_at: r.created_at,
    program_title: r.programs?.title ?? null,
    credential_name: r.credential_registry?.name ?? null,
    credential_abbreviation: r.credential_registry?.abbreviation ?? null,
  }));

  // ── 13. TRAINING HOURS (optional) ─────────────────────────────────
  const activeEnrollmentId =
    enrollments.find(
      (e) =>
        ACCESS_STATES.includes(e.status ?? '') ||
        ACCESS_STATES.includes(e.enrollment_state ?? ''),
    )?.id ?? null;

  const { data: attendanceData, error: attendanceErr } = activeEnrollmentId
    ? await supabase
        .from('attendance_hours')
        .select('hours_logged, date, type')
        .eq('enrollment_id', activeEnrollmentId)
        .order('date', { ascending: false })
        .limit(30)
    : { data: [], error: null };

  if (attendanceErr) {
    warnings.push('attendance_hours query failed');
    logger.warn('loadLearnerDashboard: attendance_hours query failed', attendanceErr);
  }

  const { data: hoursData, error: hoursErr } = await supabase
    .from('hour_entries')
    .select('hours_claimed')
    .eq('user_id', user.id);

  if (hoursErr) {
    warnings.push('hour_entries query failed');
    logger.warn('loadLearnerDashboard: hour_entries query failed', hoursErr);
  }

  const attendanceHours = (attendanceData ?? []).reduce(
    (sum: number, a: any) => sum + (a.hours_logged ?? 0),
    0,
  );
  const trainingHours = (hoursData ?? []).reduce(
    (sum: number, h: any) => sum + Number(h.hours_claimed || 0),
    0,
  );
  const totalHours = attendanceHours || trainingHours;

  // ── 14. MESSAGES (optional) ───────────────────────────────────────
  const { data: messageRows, error: msgErr } = await supabase
    .from('messages')
    .select('id, subject, body, created_at, sender_id, read')
    .eq('recipient_id', user.id)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(3);

  if (msgErr) {
    warnings.push('messages query failed');
    logger.warn('loadLearnerDashboard: messages query failed', msgErr);
  }

  // ── 15. SCHEDULE — scoped to student's cohort only ─────────────────
  // cohort_sessions has no `title` column.
  const cohortIds = rows.map((e: any) => e.cohort_id).filter(Boolean) as string[];

  const { data: scheduleRows, error: scheduleErr } =
    cohortIds.length > 0
      ? await supabase
          .from('cohort_sessions')
          .select('id, session_date, start_time, end_time, location, modality')
          .in('cohort_id', cohortIds)
          .gte('session_date', new Date().toISOString().split('T')[0])
          .order('session_date', { ascending: true })
          .limit(3)
      : { data: [], error: null };

  if (scheduleErr) {
    warnings.push('cohort_sessions query failed');
    logger.warn('loadLearnerDashboard: cohort_sessions query failed', scheduleErr);
  }

  // ── 16. APPLICATIONS ──────────────────────────────────────────────
  const { data: applications, error: appErr } = await supabase
    .from('applications')
    .select('id, status, payment_status, program_id, program_slug, funding_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (appErr) {
    warnings.push('applications query failed');
    logger.warn('loadLearnerDashboard: applications query failed', appErr);
  }

  const workoneApp =
    (applications ?? []).find((a: any) => a.status === 'pending_workone') ?? null;

  // ── 17. EXTERNAL ENROLLMENTS (optional) ───────────────────────────
  const { data: externalEnrollments, error: extErr } = await supabase
    .from('external_program_enrollments')
    .select('id, program_slug, enrollment_state, start_date, notes, created_at')
    .eq('user_id', user.id)
    .eq('enrollment_state', 'active')
    .order('created_at', { ascending: false });

  if (extErr) {
    warnings.push('external_program_enrollments query failed');
    logger.warn('loadLearnerDashboard: external_program_enrollments query failed', extErr);
  }

  // ── 18. PENDING ONBOARDING (optional) ─────────────────────────────
  const { data: pendingOnboarding, error: onboardErr } = await supabase
    .from('program_enrollments')
    .select('id, enrollment_state, next_required_action, full_name, program_id, program_slug')
    .eq('user_id', user.id)
    .in('enrollment_state', [
      'applied',
      'approved',
      'confirmed',
      'orientation_complete',
      'documents_complete',
    ])
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (onboardErr) {
    warnings.push('pending_onboarding query failed');
    logger.warn('loadLearnerDashboard: pending_onboarding query failed', onboardErr);
  }

  // ── 19. PAID-BUT-NOT-ENROLLED DIAGNOSTIC (log only) ───────────────
  const paidApp = (applications ?? []).find(
    (a) => a.payment_status === 'paid' && a.status !== 'enrolled',
  );
  if (paidApp) {
    const { data: stripeSession } = await supabase
      .from('stripe_sessions_staging')
      .select('session_id')
      .eq('application_id', paidApp.id)
      .eq('payment_status', 'paid')
      .limit(1)
      .maybeSingle();
    if (stripeSession) {
      logger.warn('[dashboard-loader] Paid session found but no active enrollment', {
        userId: user.id,
        appId: paidApp.id,
      });
    }
  }

  // ── 20. DIGITAL BINDER ────────────────────────────────────────────
  const { data: binderRow, error: binderErr } = await supabase
    .from('digital_binders')
    .select('id, status, enrollment_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (binderErr) {
    warnings.push('digital_binders query failed');
    logger.warn('loadLearnerDashboard: digital_binders query failed', binderErr);
  }

  // ── 21. DERIVED STATS ─────────────────────────────────────────────
  const activeEnrollments = enrollments.filter(
    (e) =>
      ACCESS_STATES.includes(e.status ?? '') ||
      ACCESS_STATES.includes(e.enrollment_state ?? ''),
  );
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');
  const averageProgress =
    activeEnrollments.length > 0
      ? Math.round(
          activeEnrollments.reduce((sum, e) => sum + (e.progress_percent ?? 0), 0) /
            activeEnrollments.length,
        )
      : 0;

  if (warnings.length > 0) {
    logger.warn('[dashboard-loader] Non-fatal query warnings', { warnings, userId: user.id });
  }

  return {
    user: { id: user.id, email: user.email },
    profile,
    enrollments,
    activeEnrollments,
    completedEnrollments,
    averageProgress,
    lessonProgress: (lessonProgressRows ?? []) as LearnerDashboardData['lessonProgress'],
    certificates,
    notifications: (notificationRows ?? []) as NotificationDTO[],
    announcements: (announcementRows ?? []) as AnnouncementDTO[],
    achievements,
    certRequests,
    totalHours,
    attendanceHours,
    recentMessages: (messageRows ?? []) as MessageDTO[],
    upcomingSchedule: (scheduleRows ?? []) as ScheduleSessionDTO[],
    workoneApp,
    externalEnrollments: (externalEnrollments ?? []) as LearnerDashboardData['externalEnrollments'],
    pendingOnboarding: pendingOnboarding ?? null,
    applications: (applications ?? []) as LearnerDashboardData['applications'],
    attendanceData: (attendanceData ?? []) as LearnerDashboardData['attendanceData'],
    onboardingDone: !!profile?.onboarding_completed,
    accessGranted: !!(programEnrollments ?? []).find((e: any) => e.access_granted_at),
    latestEnrollment: enrollments[0] ?? null,
    binder: binderRow
      ? {
          id: binderRow.id,
          status: binderRow.status ?? 'unknown',
          enrollment_id: binderRow.enrollment_id ?? null,
        }
      : null,
    warnings,
  };
}


