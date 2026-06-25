import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Student Dashboard',
  description: 'Your learning dashboard — track progress, courses, and achievements',
  path: '/lms/(app)/dashboard',
});

import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import {
  Play,
  ArrowRight,
  Award,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Flame,
  GraduationCap,
  Target,
  Users,
  HelpCircle,
  BarChart2,
  CreditCard,
  ExternalLink,
  DollarSign,
  Upload,
  BadgeCheck,
  MessageSquare,
} from 'lucide-react';
import { NotificationBell } from '@/components/lms/NotificationBell';
import { GlobalSearch } from '@/components/lms/GlobalSearch';
import WorkOneChecklistSection from '@/components/workone/WorkOneChecklist';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export default async function StudentDashboard() {
  const { user, profile } = await requireRole(['student', 'admin']);
  const supabase = await createClient();

  // ── Core data fetches ────────────────────────────────────────────────────
  const [
    programEnrollmentsRes,
    courseEnrollmentsRes,
    certificationsRes,
    workoneAppRes,
    quizAttemptsRes,
    paymentLogsRes,
    externalCoursesRes,
    externalCompletionsRes,
  ] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('id, status, enrolled_at, progress_percent, program_id, programs ( id, title, slug )')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('program_enrollments')
      .select(
        'id, status, enrolled_at, progress_percent, course_id, programs ( id, title, description )',
      )
      .eq('user_id', user.id)
      .not('course_id', 'is', null)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id, course_title, issued_at, verification_code')
      .eq('user_id', user.id),
    supabase
      .from('applications')
      .select('id, status, requested_funding_source')
      .eq('user_id', user.id)
      .eq('status', 'pending_workone')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('quiz_attempts')
      .select('id, score, passed, completed_at, quiz_id, quizzes(title)')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('payment_logs')
      .select('id, amount, status, completed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    // External industry partner courses for enrolled programs
    supabase
      .from('program_external_courses')
      .select(
        'id, title, partner_name, external_url, credential_type, is_required, elevate_fee_cents, fee_label, support_included, program_id, programs(slug, title)',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(20),
    // Learner's completions/payments for external courses
    supabase
      .from('external_course_completions')
      .select('id, external_course_id, completed_at, certificate_url, approved_at, elevate_sponsored, stripe_session_id')
      .eq('user_id', user.id),
  ]);

  // FKs now exist — joins resolve natively
  const programEnrollments = programEnrollmentsRes.data ?? [];
  const courseEnrollments = courseEnrollmentsRes.data ?? [];
  const certifications = (certificationsRes.data ?? []).map((c: any) => ({
    ...c,
    issued_at: c.issued_at ?? null,
  }));
  const workoneApp = workoneAppRes.data;
  const isPendingWorkone = !!workoneApp;
  const recentQuizAttempts = quizAttemptsRes.data ?? [];
  const recentPayments = paymentLogsRes.data ?? [];

  // External courses — filter to programs the learner is enrolled in
  const enrolledProgramIds = new Set(
    programEnrollments.map((e: any) => e.program_id).filter(Boolean),
  );
  const allExternalCourses = (externalCoursesRes.data ?? []) as any[];
  const externalCourses = allExternalCourses.filter((c: any) =>
    enrolledProgramIds.has(c.program_id),
  );
  const externalCompletions = (externalCompletionsRes.data ?? []) as any[];
  const extCompletionMap = new Map(externalCompletions.map((c: any) => [c.external_course_id, c]));
  const completionByExternalCourseId = extCompletionMap;

  const totalPaidCents = recentPayments
    .filter((p) => {
      const s = p.status?.toLowerCase();
      return s === 'completed' || s === 'succeeded' || s === 'paid';
    })
    .reduce((sum: number, p) => sum + (p.amount ?? 0), 0);

  // ── Active enrollment + resume point ────────────────────────────────────
  const activeEnrollment =
    courseEnrollments.find((e) => e.status === 'active') ||
    programEnrollments.find((e) => e.status === 'active' || e.status === 'enrolled') ||
    courseEnrollments[0] ||
    programEnrollments[0] ||
    null;

  const activeCourseId = (activeEnrollment as any)?.course_id ?? null;
  const courseProgress = activeEnrollment?.progress_percent ?? 0;
  const isPendingApproval =
    activeEnrollment?.status === 'pending_approval' ||
    activeEnrollment?.status === 'enrolled_pending_approval';

  let resumeLessonId: string | null = null;
  let resumeCourseId: string | null = activeCourseId;
  let nextLessonTitle: string | null = null;
  let nextLessonMinutes: number | null = null;
  let completedLessons = 0;
  let totalLessons = 0;
  let currentModuleTitle: string | null = null;

  if (activeCourseId) {
    // Count total lessons
    const { count: total } = await supabase
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', activeCourseId);
    totalLessons = total ?? 0;

    // Count completed lessons
    const { count: done } = await supabase
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('course_id', activeCourseId)
      .eq('completed', true);
    completedLessons = done ?? 0;

    // Find next incomplete lesson
    const { data: incompleteLesson } = await supabase
      .from('lesson_progress')
      .select('lesson_id, course_id')
      .eq('user_id', user.id)
      .eq('course_id', activeCourseId)
      .eq('completed', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (incompleteLesson?.lesson_id) {
      resumeLessonId = incompleteLesson.lesson_id;
      resumeCourseId = incompleteLesson.course_id ?? activeCourseId;
      // Get lesson details
      const { data: lessonDetail } = await supabase
        .from('course_lessons')
        .select('title, duration_minutes, module_id, course_modules(title)')
        .eq('id', resumeLessonId)
        .maybeSingle();
      if (lessonDetail) {
        nextLessonTitle = lessonDetail.title;
        nextLessonMinutes = lessonDetail.duration_minutes ?? null;
        currentModuleTitle = (lessonDetail.course_modules as any)?.title ?? null;
      }
    } else {
      // No incomplete lesson — get first lesson (fresh start)
      const { data: firstLesson } = await supabase
        .from('course_lessons')
        .select('id, title, duration_minutes, module_id, course_modules(title)')
        .eq('course_id', activeCourseId)
        .order('order_index', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (firstLesson?.id) {
        resumeLessonId = firstLesson.id;
        nextLessonTitle = firstLesson.title;
        nextLessonMinutes = firstLesson.duration_minutes ?? null;
        currentModuleTitle = (firstLesson.course_modules as any)?.title ?? null;
      }
    }
  }

  const resumeHref =
    resumeCourseId && resumeLessonId
      ? `/lms/courses/${resumeCourseId}/lessons/${resumeLessonId}`
      : activeCourseId
        ? `/lms/courses/${activeCourseId}`
        : null;

  const courseHref = activeCourseId ? `/lms/courses/${activeCourseId}` : '/lms/courses';
  const isFirstVisit = completedLessons === 0;
  const isComplete = totalLessons > 0 && completedLessons >= totalLessons;
  const lessonsLeft = totalLessons - completedLessons;
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const courseName = (activeEnrollment as any)?.programs?.title ?? null;

  // ── Phase calculation (rough bucketing for behavioral copy) ─────────────
  const phaseNumber =
    totalLessons > 0 ? Math.min(5, Math.ceil((completedLessons / totalLessons) * 5) + 1) : 1;

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <GraduationCap aria-label="graduationcap" className="w-4 h-4 text-brand-blue-600" />
          <span className="font-semibold text-slate-900">My Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <NotificationBell />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* COMMAND CENTER — above the fold */}
        {activeEnrollment && !isPendingApproval ? (
          <div className="bg-brand-blue-700 rounded-2xl overflow-hidden">
            <div className="px-6 sm:px-8 py-6 sm:py-8">
              {/* Identity line */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {courseName ?? 'Your Training'}
                </span>
                {currentModuleTitle && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-xs font-semibold text-slate-400 truncate max-w-7xl">
                      {currentModuleTitle}
                    </span>
                  </>
                )}
              </div>

              {/* Dominant heading */}
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">
                {isComplete
                  ? `Training complete, ${firstName}`
                  : isFirstVisit
                    ? `Ready to start, ${firstName}?`
                    : `Keep going, ${firstName}`}
              </h1>

              {/* Behavioral sub-copy */}
              <p className="text-slate-500 text-sm mb-6 max-w-xl">
                {isComplete
                  ? 'You finished all lessons. Your certification pathway is now open.'
                  : isFirstVisit
                    ? `Your first lesson is ready. It takes about ${nextLessonMinutes ? `${nextLessonMinutes} min` : 'a few minutes'} to complete.`
                    : `${lessonsLeft} lesson${lessonsLeft !== 1 ? 's' : ''} left in Phase ${phaseNumber}${nextLessonMinutes ? ` · ~${nextLessonMinutes} min next` : ''}.`}
              </p>

              {/* Progress bar */}
              {totalLessons > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400 font-medium">
                      {completedLessons} of {totalLessons} lessons complete
                    </span>
                    <span className="text-white font-black tabular-nums">{courseProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(courseProgress, completedLessons > 0 ? 3 : 0)}%`,
                      }}
                    />
                  </div>
                  {!isComplete && (
                    <p className="text-xs text-slate-500 mt-2">
                      Phase {phaseNumber} of 5 · {lessonsLeft} lesson{lessonsLeft !== 1 ? 's' : ''}{' '}
                      to next checkpoint
                    </p>
                  )}
                </div>
              )}

              {/* Primary CTA */}
              <div className="flex flex-wrap items-center gap-3">
                {isComplete ? (
                  <Link
                    href="/lms/certificates"
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-black px-6 py-3.5 rounded-xl transition text-sm shadow-lg"
                  >
                    <Award aria-label="award" className="w-4 h-4" /> View Your Certificate
                  </Link>
                ) : resumeHref ? (
                  <Link
                    href={resumeHref}
                    className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-500 text-white font-black px-6 py-3.5 rounded-xl transition text-sm shadow-lg shadow-brand-blue-900/30"
                  >
                    <Play className="w-4 h-4" />
                    {isFirstVisit ? 'Start Training' : 'Continue Training'}
                  </Link>
                ) : null}
                <Link
                  href={courseHref}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition"
                >
                  View full curriculum <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Next lesson strip */}
            {!isComplete && nextLessonTitle && resumeHref && (
              <div className="border-t border-slate-800 px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Play className="w-3.5 h-3.5 text-brand-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Up next</p>
                    <p className="text-sm font-semibold text-white truncate">{nextLessonTitle}</p>
                  </div>
                </div>
                {nextLessonMinutes && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />~{nextLessonMinutes} min
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isPendingApproval ? (
          /* Pending approval state */
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 mb-1">Enrollment Under Review</h1>
                <p className="text-slate-600 text-sm mb-4">
                  Your application is being reviewed. We'll email you at{' '}
                  <strong>{user.email}</strong> when confirmed — usually within 1–2 business days.
                </p>
                <Link
                  href="/lms/apply/status"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
                >
                  Check Application Status <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* No enrollment — drive to apply */
          <div className="bg-gradient-to-br from-brand-blue-600 to-brand-blue-800 rounded-2xl p-6 sm:p-8 text-white">
            <div className="max-w-xl">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-2">
                Welcome, {firstName}
              </p>
              <h1 className="text-2xl sm:text-3xl font-black mb-3 leading-tight">
                Start your workforce training — free for eligible participants
              </h1>
              <p className="text-blue-200 text-sm mb-6">
                WIOA funding covers tuition for qualifying learners. Apply in minutes and get a
                decision within 2 business days.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/lms/apply"
                  className="inline-flex items-center gap-2 bg-white text-brand-blue-700 font-black px-6 py-3.5 rounded-xl text-sm hover:bg-blue-50 transition shadow-lg"
                >
                  Apply Now — Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/lms/courses"
                  className="inline-flex items-center gap-2 border border-blue-400 text-slate-900 font-semibold px-5 py-3.5 rounded-xl text-sm hover:bg-white/10 transition"
                >
                  Browse Programs
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* WorkOne checklist (gated) */}
        {isPendingWorkone && (
          <WorkOneChecklistSection
            pendingWorkone={isPendingWorkone}
            fundingSource={workoneApp?.requested_funding_source ?? undefined}
          />
        )}

        {/* Main 2-col layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Programs */}
            {programEnrollments.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" /> My Programs
                  </h2>
                  <Link
                    href="/lms/courses"
                    className="text-xs text-brand-blue-600 font-medium hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {programEnrollments.slice(0, 4).map((enrollment: any) => {
                    const prog = enrollment.programs;
                    const pct = enrollment.progress_percent ?? 0;
                    const isActive =
                      enrollment.status === 'active' || enrollment.status === 'enrolled';
                    return (
                      <div key={enrollment.id} className="px-5 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-brand-blue-100 flex items-center justify-center flex-shrink-0">
                          <GraduationCap aria-label="graduationcap" className="w-5 h-5 text-brand-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {prog?.title ?? 'Program'}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-blue-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 tabular-nums flex-shrink-0">
                              {pct}%
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <Link
                            href={`/lms/courses`}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                          >
                            <Play className="w-3 h-3" /> Continue
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Industry Partner Courses */}
            {externalCourses.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-brand-blue-500" />
                    Industry Partner Courses
                  </h2>
                  <span className="text-xs text-slate-400">{externalCourses.length} course{externalCourses.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {externalCourses.map((course: any) => {
                    const completion = extCompletionMap.get(course.id);
                    const isPaid = !!completion?.stripe_session_id || !!completion?.elevate_sponsored;
                    const hasUploaded = !!completion?.certificate_url;
                    const isApproved = !!completion?.approved_at;
                    const feeDollars = ((course.elevate_fee_cents ?? 0) / 100).toFixed(2);
                    const supports: string[] = Array.isArray(course.support_included)
                      ? course.support_included
                      : [];

                    // Status label
                    let statusLabel = 'Not started';
                    let statusColor = 'bg-slate-100 text-slate-500';
                    if (isApproved) { statusLabel = 'Approved'; statusColor = 'bg-brand-green-100 text-brand-green-700'; }
                    else if (hasUploaded) { statusLabel = 'Under review'; statusColor = 'bg-amber-100 text-amber-700'; }
                    else if (isPaid) { statusLabel = 'In progress'; statusColor = 'bg-brand-blue-100 text-brand-blue-700'; }

                    return (
                      <div key={course.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                                {statusLabel}
                              </span>
                              {course.is_required && (
                                <span className="text-xs text-slate-400">Required</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-900 leading-snug">{course.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{course.partner_name} · {course.credential_type}</p>
                          </div>
                          {isApproved ? (
                            <CheckCircle className="w-5 h-5 text-brand-green-500 flex-shrink-0 mt-0.5" />
                          ) : null}
                        </div>

                        {/* Support included */}
                        {supports.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {supports.slice(0, 3).map((s: string) => (
                              <span key={s} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {supports.length > 3 && (
                              <span className="text-xs text-slate-400">+{supports.length - 3} more</span>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {/* Start Course — always visible */}
                          <a
                            href={course.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium bg-brand-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-blue-700 transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Start Course
                          </a>

                          {/* Pay support fee — only if not yet paid */}
                          {!isPaid && course.elevate_fee_cents > 0 && (
                            <a
                              href={`/api/programs/${(course.programs as any)?.slug ?? ''}/external-courses/${course.id}/checkout`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium border border-brand-green-600 text-brand-green-700 px-3 py-1.5 rounded-lg hover:bg-brand-green-50 transition"
                            >
                              <DollarSign className="w-3 h-3" />
                              Pay Support Fee · ${feeDollars}
                            </a>
                          )}

                          {/* Upload certificate — once paid */}
                          {isPaid && !hasUploaded && (
                            <Link
                              href={`/lms/programs/${(course.programs as any)?.slug ?? ''}/external-courses/${course.id}/upload`}
                              className="inline-flex items-center gap-1.5 text-xs font-medium border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition"
                            >
                              <Upload className="w-3 h-3" />
                              Upload Certificate
                            </Link>
                          )}

                          {/* Uploaded, awaiting review */}
                          {hasUploaded && !isApproved && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                              <Clock className="w-3 h-3" />
                              Certificate under review
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Elevate support fees cover coaching, progress tracking, and job readiness — not the external course cost.
                  </p>
                </div>
              </div>
            )}

            {/* Certifications earned */}
            {certifications.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award aria-label="award" className="w-4 h-4 text-amber-500" /> Credentials Earned
                  </h2>
                  <Link
                    href="/lms/certificates"
                    className="text-xs text-brand-blue-600 font-medium hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="p-4 flex flex-wrap gap-3">
                  {certifications.slice(0, 4).map((cert: any) => (
                    <div
                      key={cert.id}
                      className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5"
                    >
                      <Award aria-label="award" className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {cert.course_title ?? 'Certificate'}
                        </p>
                        {cert.issued_at && (
                          <p className="text-xs text-slate-500">
                            {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice & exam scores */}
            {recentQuizAttempts.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-slate-400" /> Recent Practice Scores
                  </h2>
                  <Link
                    href="/lms/quizzes"
                    className="text-xs text-brand-blue-600 font-medium hover:underline"
                  >
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentQuizAttempts.map((attempt: any) => {
                    const score = attempt.score ?? 0;
                    const passed = attempt.passed ?? false;
                    const quizTitle = attempt.quizzes?.title ?? 'Practice Assessment';
                    const date = attempt.completed_at
                      ? new Date(attempt.completed_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : null;
                    return (
                      <div key={attempt.id} className="px-5 py-3.5 flex items-center gap-4">
                        {/* Score ring */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm tabular-nums ${
                            passed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {score}%
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {quizTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className={`text-xs font-bold ${passed ? 'text-emerald-600' : 'text-red-500'}`}
                            >
                              {passed ? 'Passed' : 'Not passed'}
                            </span>
                            {date && <span className="text-xs text-slate-400">· {date}</span>}
                          </div>
                        </div>
                        {/* Score bar */}
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`h-full rounded-full ${passed ? 'bg-emerald-500' : 'bg-red-400'}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Learning tools grid */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Learning Tools</h2>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  {
                    href: '/lms/courses',
                    label: 'My Programs',
                    icon: BookOpen,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    href: '/lms/assignments',
                    label: 'Assignments',
                    icon: Target,
                    color: 'text-purple-600',
                    bg: 'bg-purple-50',
                  },
                  {
                    href: '/lms/certificates',
                    label: 'Certificates',
                    icon: Award,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50',
                  },
                  {
                    href: '/lms/calendar',
                    label: 'Schedule',
                    icon: Clock,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50',
                  },
                  {
                    href: '/lms/messages',
                    label: 'Messages',
                    icon: MessageSquare,
                    color: 'text-brand-blue-600',
                    bg: 'bg-brand-blue-50',
                  },
                  {
                    href: '/lms/support',
                    label: 'Get Help',
                    icon: HelpCircle,
                    color: 'text-slate-600',
                    bg: 'bg-slate-100',
                  },
                ].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 group"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${tool.bg} flex items-center justify-center flex-shrink-0`}
                    >
                      <tool.icon className={`w-4.5 h-4.5 ${tool.color}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900">
                      {tool.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
            {/* External Career Pathways */}
            {externalCourses.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">External Career Pathways</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Industry-recognized certificates from Google, Microsoft, IBM, and Cisco
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-brand-blue-600 bg-brand-blue-50 px-2 py-1 rounded-full">
                    {externalCourses.length} available
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {externalCourses.map((course: any) => {
                    const completion = completionByExternalCourseId.get(course.id);
                    const isApproved = !!completion?.approved_at;
                    const isUploaded = !!completion?.certificate_url && !isApproved;
                    const isStarted = !!completion && !isApproved && !isUploaded;

                    return (
                      <div key={course.id} className="px-5 py-4 flex items-start gap-4">
                        {/* Status icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {isApproved ? (
                            <div className="w-8 h-8 rounded-full bg-brand-green-100 flex items-center justify-center">
                              <BadgeCheck className="w-4 h-4 text-brand-green-600" />
                            </div>
                          ) : isUploaded ? (
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-amber-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <ExternalLink className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900 leading-snug">
                                {course.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {course.partner_name}
                                {course.duration_display && ` · ${course.duration_display}`}
                              </p>
                            </div>
                            {course.is_required && (
                              <span className="flex-shrink-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                Required
                              </span>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green-700 bg-brand-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                            ) : isUploaded ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" /> Certificate under review
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                Not started
                              </span>
                            )}
                            {course.credential_type && (
                              <span className="text-xs text-slate-400">
                                {course.credential_type}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          {!isApproved && (
                            <div className="mt-3 flex items-center gap-2 flex-wrap">
                              <a
                                href={course.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-blue-700 hover:bg-brand-blue-800 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {isUploaded ? 'Return to Course' : 'Start Course'}
                              </a>
                              {!isUploaded && (
                                <Link
                                  href={`/lms/external-pathways/${course.id}/upload`}
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <Upload className="w-3 h-3" />
                                  Upload Certificate
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
                  <p className="text-xs text-slate-500">
                    Complete a course on the provider&apos;s platform, then upload your certificate
                    here for verification. Elevate does not copy or host external course content.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            {/* Progress snapshot */}
            {activeEnrollment && !isPendingApproval && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" /> Your Progress
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: 'Lessons done',
                      value: `${completedLessons} / ${totalLessons || '—'}`,
                    },
                    { label: 'Overall progress', value: `${courseProgress}%` },
                    { label: 'Current phase', value: `Phase ${phaseNumber} of 5` },
                    { label: 'Credentials', value: certifications.length.toString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{label}</span>
                      <span className="text-xs font-bold text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
                {!isComplete && resumeHref && (
                  <Link
                    href={resumeHref}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition"
                  >
                    <Play className="w-3.5 h-3.5" /> Continue Training
                  </Link>
                )}
              </div>
            )}

            {/* Credential pathway */}
            <div className="bg-brand-blue-700 rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Credential Pathway
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Complete all lessons', done: isComplete },
                  { label: 'Pass all checkpoints', done: courseProgress >= 80 },
                  { label: 'Earn certification', done: certifications.length > 0 },
                  { label: 'Job placement ready', done: false },
                ].map(({ label, done }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    >
                      {done ? (
                        <CheckCircle className="w-3 h-3 text-white" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${done ? 'text-emerald-400 line-through' : 'text-slate-300'}`}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payments card */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400" /> Payments
                </h3>
                <Link
                  href="/lms/payments"
                  className="text-xs text-brand-blue-600 font-medium hover:underline"
                >
                  View all →
                </Link>
              </div>
              {recentPayments.length === 0 ? (
                <div className="px-5 py-4 text-xs text-slate-400">No payment records yet.</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentPayments.map((p) => {
                    const isPaid =
                      p.status === 'completed' || p.status === 'succeeded' || p.status === 'paid';
                    return (
                      <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          />
                          <span className="text-xs text-slate-500 truncate">
                            {p.completed_at
                              ? new Date(p.completed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : new Date(p.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-900 tabular-nums flex-shrink-0">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                          }).format((p.amount ?? 0) / 100)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
              {totalPaidCents > 0 && (
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total paid</span>
                  <span className="text-xs font-black text-slate-900 tabular-nums">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                      totalPaidCents / 100,
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Support card */}
            <div className="bg-brand-blue-50 rounded-xl border border-brand-blue-200 p-5">
              <h3 className="text-sm font-bold text-brand-blue-900 mb-2">Need Help?</h3>
              <p className="text-xs text-brand-blue-700 mb-4">
                Your advisor is here every step of the way.
              </p>
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                className="block w-full text-center bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition"
              >
                Call {PLATFORM_DEFAULTS.supportPhone}
              </a>
              <Link
                href="/lms/support"
                className="block w-full text-center text-brand-blue-600 hover:text-brand-blue-800 text-xs font-medium mt-2 py-1.5"
              >
                Submit a support request →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
