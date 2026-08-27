import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart2,
  BookOpen,
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Play,
  Upload,
} from 'lucide-react';
import { generateInternalMetadata } from '@/lib/seo/metadata';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { NotificationBell } from '@/components/lms/NotificationBell';
import { GlobalSearch } from '@/components/lms/GlobalSearch';
import WorkOneChecklistSection from '@/components/workone/WorkOneChecklist';
import { ParisFloatingWrapper } from '@/components/paris/ParisFloatingWrapper';
import { getProgramCardImage } from '@/lib/images/programImages';
import { loadLearnerWorkspace } from '@/lib/learner/workspace';
import { getActiveJobs } from '@/lib/data/jobs';
import JobCard from '@/components/jobs/JobCard';
import { MARKETING_HOST } from '@/lib/routing/portal-map';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Student Dashboard',
  description: 'Your learning dashboard — track progress, courses, and achievements',
  path: '/lms/dashboard',
});

export const dynamic = 'force-dynamic';

type CourseEnrollmentRow = {
  id: string;
  status: string | null;
  course_id: string | null;
  created_at: string | null;
  completed_at: string | null;
};

type CourseRow = {
  id: string;
  title: string | null;
  description: string | null;
  status: string | null;
  is_active: boolean | null;
};

type LessonRow = {
  id: string;
  title: string | null;
  duration_minutes: number | null;
};

function paidStatus(status: string | null | undefined) {
  const value = String(status ?? '').toLowerCase();
  return value === 'completed' || value === 'succeeded' || value === 'paid';
}

function isBlockedExternalTraining(course: { partner_name?: string | null; external_url?: string | null }) {
  const provider = String(course.partner_name || '').toLowerCase();
  const url = String(course.external_url || '').toLowerCase();
  return provider.includes('coursera') || url.includes('coursera.org');
}

export default async function StudentDashboard() {
  const { user, profile } = await requireRole(['student', 'learner', 'admin']);
  const supabase = await createClient();
  const workspace = await loadLearnerWorkspace(user.id, profile?.role || 'student');
  const careerJobs = await getActiveJobs({ limit: 4 });

  const [
    certificationsRes,
    workoneAppRes,
    quizAttemptsRes,
    paymentLogsRes,
    externalCoursesRes,
    externalCompletionsRes,
  ] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, course_title, issued_at, verification_code')
      .eq('user_id', user.id)
      .order('issued_at', { ascending: false }),
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
      .eq('user_uuid', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('payment_logs')
      .select('id, amount, status, completed_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('program_external_courses')
      .select(
        'id, title, partner_name, external_url, description, duration_display, credential_type, credential_name, enrollment_instructions, is_required, elevate_fee_cents, fee_label, support_included, program_id, programs(slug, title)',
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(30),
    supabase
      .from('external_course_completions')
      .select('id, external_course_id, completed_at, certificate_url, approved_at, elevate_sponsored, stripe_session_id')
      .eq('user_id', user.id),
  ]);

  const programEnrollments = workspace.enrollments.filter((row) => row.program_id).map((row) => ({
    id: row.enrollment_id,
    status: row.status,
    enrolled_at: row.created_at,
    program_id: row.program_id,
    programs: { id: row.program_id, title: row.program_title, slug: row.program_slug },
  }));
  const courseEnrollments = workspace.enrollments
    .filter((row) => row.course_id)
    .map((row) => ({ id: row.enrollment_id, status: row.status, course_id: row.course_id, created_at: row.created_at, completed_at: null })) as CourseEnrollmentRow[];
  const certifications = certificationsRes.data ?? [];
  const recentQuizAttempts = quizAttemptsRes.data ?? [];
  const recentPayments = paymentLogsRes.data ?? [];
  const workoneApp = workoneAppRes.data;
  const isPendingWorkone = Boolean(workoneApp);

  const courseIds = Array.from(
    new Set(courseEnrollments.map((row) => row.course_id).filter((value): value is string => Boolean(value))),
  );
  const { data: courseRows, error: courseRowsError } = courseIds.length
    ? await supabase.from('courses').select('id, title, description, status, is_active').in('id', courseIds)
    : { data: [], error: null };
  if (courseRowsError) throw new Error(`STUDENT_COURSES_FAILED:${courseRowsError.message}`);

  const courseMap = new Map(
    ((courseRows ?? []) as CourseRow[]).map((course) => [course.id, course]),
  );

  const activeWorkspaceEnrollment =
    workspace.enrollments.find((row) => row.source_table === 'partner_lms_enrollments' && ['active', 'enrolled', 'in_progress'].includes(String(row.status))) ??
    workspace.enrollments.find((row) => ['active', 'enrolled', 'in_progress'].includes(String(row.status))) ??
    workspace.enrollments[0] ??
    null;
  const activeCourseEnrollment = activeWorkspaceEnrollment
    ? courseEnrollments.find((row) => row.id === activeWorkspaceEnrollment.enrollment_id) ?? null
    : null;
  const activeCourseId = activeCourseEnrollment?.course_id ?? null;
  const isPartnerCourse = activeWorkspaceEnrollment?.source_table === 'partner_lms_enrollments';
  const activeCourse = activeCourseId
    ? courseMap.get(activeCourseId) ?? (isPartnerCourse ? { id: activeCourseId, title: activeWorkspaceEnrollment?.course_title, description: activeWorkspaceEnrollment?.course_description, status: 'published', is_active: true } : null)
    : null;
  const activeCourseIsAvailable = isPartnerCourse || (activeCourse?.status === 'published' && activeCourse.is_active === true);

  let lessons: LessonRow[] = [];
  let completedLessonIds = new Set<string>();

  if (activeCourseId && activeCourseIsAvailable && !isPartnerCourse) {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase
        .from('course_lessons')
        .select('id, title, duration_minutes')
        .eq('course_id', activeCourseId)
        .order('order_index', { ascending: true }),
      supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', activeCourseId),
    ]);

    if (lessonsRes.error) throw new Error(`STUDENT_LESSONS_FAILED:${lessonsRes.error.message}`);
    if (progressRes.error) throw new Error(`STUDENT_LESSON_PROGRESS_FAILED:${progressRes.error.message}`);

    lessons = (lessonsRes.data ?? []) as LessonRow[];
    completedLessonIds = new Set(
      (progressRes.data ?? [])
        .filter((row: any) => row.completed === true && row.lesson_id)
        .map((row: any) => String(row.lesson_id)),
    );
  }

  const totalLessons = lessons.length;
  const completedLessons = completedLessonIds.size;
  const courseProgress = totalLessons > 0
    ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
    : 0;
  const nextLesson = lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null;
  const isComplete = totalLessons > 0 && completedLessons >= totalLessons;
  const isFirstVisit = completedLessons === 0;
  const lessonsLeft = Math.max(0, totalLessons - completedLessons);
  const phaseNumber = totalLessons > 0
    ? Math.min(5, Math.max(1, Math.ceil((courseProgress || 1) / 20)))
    : 1;

  const resumeHref = isPartnerCourse && activeWorkspaceEnrollment?.continue_url
    ? activeWorkspaceEnrollment.continue_url
    : activeCourseId && activeCourseIsAvailable
      ? nextLesson
      ? `/lms/courses/${activeCourseId}/lessons/${nextLesson.id}`
      : `/lms/courses/${activeCourseId}`
    : null;

  const enrolledProgramIds = new Set(
    programEnrollments.map((row: any) => row.program_id).filter(Boolean),
  );
  const externalCourses = (externalCoursesRes.data ?? []).filter(
    (course: any) => enrolledProgramIds.has(course.program_id) && !isBlockedExternalTraining(course),
  );
  const completionByExternalCourseId = new Map(
    (externalCompletionsRes.data ?? []).map((row: any) => [row.external_course_id, row]),
  );

  const paidTotalCents = recentPayments
    .filter((payment: any) => paidStatus(payment.status))
    .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);

  const firstName =
    profile?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there';

  const learningTools = [
    { href: '/lms/courses', label: 'My Courses', text: 'Open your assigned courses and curriculum.', image: '/images/pages/training-classroom.webp' },
    { href: '/lms/assignments', label: 'Assignments', text: 'Review work, activities, and required submissions.', image: '/images/pages/office-admin-desk.jpg' },
    { href: '/lms/certificates', label: 'Certificates', text: 'View earned and verified training credentials.', image: '/images/pages/comp-home-highlight-success.webp' },
    { href: '/lms/calendar', label: 'Schedule', text: 'Review classes, deadlines, and upcoming activity.', image: '/images/pages/career-counseling.jpg' },
    { href: '/lms/messages', label: 'Messages', text: 'Open learner communications and program messages.', image: '/images/pages/contact-hero.jpg' },
    { href: '/lms/support', label: 'Get Help', text: 'Reach learner support when you need assistance.', image: '/images/pages/about-hero.webp' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-brand-blue-700" aria-hidden="true" />
            <span className="font-bold text-slate-950">My Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        {workspace.nextRequiredAction ? (
          <section role="alert" className="rounded-3xl border-2 border-red-400 bg-red-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-red-800">Onboarding incomplete · {workspace.onboardingPercent}% complete</p>
            <h1 className="mt-2 text-2xl font-black text-red-950">Next required action: {workspace.nextRequiredAction.title}</h1>
            <p className="mt-2 text-red-900">{workspace.nextRequiredAction.description}</p>
            <div className="mt-4 flex flex-wrap gap-3"><Link href={workspace.nextRequiredAction.href} className="rounded-xl bg-red-700 px-5 py-3 font-black text-white">Complete now</Link><Link href="/lms/onboarding" className="rounded-xl border border-red-500 bg-white px-5 py-3 font-black text-red-950">View checklist</Link></div>
          </section>
        ) : null}
        {activeCourseEnrollment && activeCourseId ? (
          <section className="overflow-hidden rounded-3xl bg-slate-950 text-white">
            <div className="p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-300">
                {activeCourse?.title ?? 'Active Course'}
              </p>
              <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
                {!activeCourseIsAvailable
                  ? `Your course is being prepared, ${firstName}`
                  : isComplete
                    ? `Training complete, ${firstName}`
                    : isFirstVisit
                      ? `Ready to start, ${firstName}?`
                      : `Keep going, ${firstName}`}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-100">
                {!activeCourseIsAvailable
                  ? 'Your enrollment is recorded. Training will open here after the curriculum and media pass final review.'
                  : isComplete
                  ? 'Every lesson in this course is recorded complete.'
                  : nextLesson
                    ? `${lessonsLeft} lesson${lessonsLeft === 1 ? '' : 's'} remaining. Next: ${nextLesson.title ?? 'lesson'}.`
                    : 'Your course is active and ready.'}
              </p>
              {activeCourse?.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">{activeCourse.description}</p> : null}

              {totalLessons > 0 && (
                <div className="mt-6 max-w-3xl">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-100">{completedLessons} of {totalLessons} verified lessons complete</span>
                    <span>{courseProgress}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-700" role="progressbar" aria-valuenow={courseProgress} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${courseProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-7 flex flex-wrap gap-3">
                {resumeHref ? (
                  <Link href={resumeHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue-600 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-500">
                    <Play className="h-4 w-4" /> {isComplete ? 'Review Course' : isFirstVisit ? 'Start Training' : 'Continue Training'}
                  </Link>
                ) : null}
                {activeCourseIsAvailable && !isPartnerCourse ? (
                  <Link href={`/lms/courses/${activeCourseId}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                    View Curriculum <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-blue-300 bg-blue-50 p-7 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-900">Welcome, {firstName}</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Choose your next training step</h1>
            <p className="mt-3 max-w-2xl font-medium text-slate-700">
              You do not currently have an active course enrollment. Review your programs, application status, and funding options before starting training.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/lms/courses" className="rounded-xl bg-brand-blue-700 px-5 py-3 font-black text-white hover:bg-brand-blue-800">Browse Courses</Link>
              <Link href="/lms/apply/status" className="rounded-xl border border-blue-400 bg-white px-5 py-3 font-bold text-blue-950 hover:bg-blue-100">Application Status</Link>
            </div>
          </section>
        )}

        {isPendingWorkone && (
          <WorkOneChecklistSection
            pendingWorkone={isPendingWorkone}
            fundingSource={workoneApp?.requested_funding_source ?? undefined}
          />
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-blue-700">Career feed</p><h2 className="mt-1 text-xl font-black">Opportunities for your next step</h2></div><Link href="/lms/career" className="text-sm font-black text-blue-800 underline">Career Services</Link></div>
          {careerJobs.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{careerJobs.map((job) => <JobCard key={job.id} job={job} showApply href="/lms/placement" />)}</div> : <div className="mt-5 rounded-xl bg-slate-50 p-5"><p className="font-bold">No current job matches.</p><p className="mt-1 text-sm text-slate-600">Placement support and career coaching remain available.</p></div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {programEnrollments.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <h2 className="font-black text-slate-950">My Programs</h2>
                  <Link href="/lms/courses" className="text-sm font-bold text-brand-blue-800 hover:underline">View courses</Link>
                </div>
                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  {programEnrollments.slice(0, 6).map((enrollment: any) => {
                    const slug = String(enrollment.programs?.slug || '');
                    const title = enrollment.programs?.title ?? 'Program';
                    return (
                      <article key={enrollment.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="relative aspect-[16/9] w-full bg-slate-100">
                          <Image
                            src={getProgramCardImage(slug)}
                            alt={`${title} program`}
                            fill
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p className="font-bold text-slate-950">{title}</p>
                          <p className="mt-1 text-xs font-semibold capitalize text-slate-700">Program status: {String(enrollment.status ?? 'recorded').replace(/_/g, ' ')}</p>
                          {slug ? <a href={`${MARKETING_HOST}/programs/${slug}`} className="mt-3 inline-flex text-sm font-bold text-brand-blue-800 hover:underline">View program</a> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {externalCourses.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-black text-slate-950"><ExternalLink className="h-4 w-4" /> Industry Partner Courses</h2>
                  <p className="mt-1 text-xs font-medium text-slate-700">External course content stays on the approved provider platform; Elevate tracks your completion evidence.</p>
                </div>
                <div className="divide-y divide-slate-100">
                  {externalCourses.map((course: any) => {
                    const completion: any = completionByExternalCourseId.get(course.id);
                    const approved = Boolean(completion?.approved_at);
                    const uploaded = Boolean(completion?.certificate_url);
                    return (
                      <div key={course.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-950">{course.title}</p>
                            <p className="mt-1 text-xs font-medium text-slate-700">{course.partner_name}{course.credential_type ? ` · ${course.credential_type}` : ''}</p>
                            {course.description ? <p className="mt-2 text-sm font-medium leading-5 text-slate-700">{course.description}</p> : null}
                            {course.duration_display ? <p className="mt-2 text-xs font-bold text-slate-900">Expected duration: {course.duration_display}</p> : null}
                            {course.credential_name ? <p className="mt-1 text-xs font-bold text-slate-900">Credential: {course.credential_name}</p> : null}
                            {course.enrollment_instructions ? <p className="mt-2 text-xs font-medium leading-5 text-slate-700">{course.enrollment_instructions}</p> : null}
                          </div>
                          {approved ? <BadgeCheck className="h-5 w-5 shrink-0 text-green-700" /> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <a href={course.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-blue-800">
                            <ExternalLink className="h-3.5 w-3.5" /> Open Course
                          </a>
                          {!approved && (
                            <Link href={`/lms/external-pathways/${course.id}/upload`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-400 px-3 py-2 text-xs font-bold text-slate-900 hover:bg-slate-50">
                              <Upload className="h-3.5 w-3.5" /> {uploaded ? 'Replace Certificate' : 'Upload Certificate'}
                            </Link>
                          )}
                          <span className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-bold ${approved ? 'bg-green-100 text-green-900' : uploaded ? 'bg-amber-100 text-amber-950' : 'bg-slate-100 text-slate-800'}`}>
                            {approved ? 'Approved' : uploaded ? 'Under review' : 'Not submitted'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {recentQuizAttempts.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h2 className="flex items-center gap-2 font-black text-slate-950"><BarChart2 className="h-4 w-4" /> Recent Practice Scores</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {recentQuizAttempts.map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center gap-4 px-5 py-4">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${attempt.passed ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}>
                        {Number(attempt.score ?? 0)}%
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-950">{attempt.quizzes?.title ?? 'Practice Assessment'}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-700">{attempt.passed ? 'Passed' : 'Not passed'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Learning Tools</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {learningTools.map((tool) => (
                  <Link key={tool.href} href={tool.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-blue-300 hover:shadow-md">
                    <div className="relative aspect-[16/9] w-full bg-slate-100">
                      <Image src={tool.image} alt={`${tool.label} learner workspace`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    </div>
                    <div className="p-4">
                      <p className="font-black text-slate-950">{tool.label}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-700">{tool.text}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">Verified Course Progress</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Stat label="Lessons complete" value={`${completedLessons} / ${totalLessons || '—'}`} />
                <Stat label="Course progress" value={`${courseProgress}%`} />
                <Stat label="Current phase" value={`Phase ${phaseNumber} of 5`} />
                <Stat label="Certificates" value={String(certifications.length)} />
              </div>
            </section>

            {certifications.length > 0 && (
              <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
                <h2 className="flex items-center gap-2 font-black text-amber-950"><Award className="h-4 w-4" /> Certificates</h2>
                <div className="mt-4 space-y-3">
                  {certifications.slice(0, 4).map((cert: any) => (
                    <div key={cert.id} className="rounded-xl bg-white p-3">
                      <p className="text-sm font-bold text-slate-950">{cert.course_title ?? 'Certificate'}</p>
                      {cert.issued_at ? <p className="mt-1 text-xs font-medium text-slate-700">{new Date(cert.issued_at).toLocaleDateString()}</p> : null}
                    </div>
                  ))}
                </div>
                <Link href="/lms/certificates" className="mt-4 inline-flex text-sm font-bold text-amber-950 hover:underline">View all certificates</Link>
              </section>
            )}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="flex items-center gap-2 font-black text-slate-950"><CreditCard className="h-4 w-4" /> Payments</h2>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">Recorded paid total</p>
                <p className="mt-1 text-2xl font-black text-slate-950">${(paidTotalCents / 100).toFixed(2)}</p>
                <div className="mt-4 space-y-2">
                  {recentPayments.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="capitalize font-medium text-slate-700">{payment.status ?? 'recorded'}</span>
                      <span className="font-bold text-slate-900">${(Number(payment.amount ?? 0) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/lms/payments" className="mt-4 inline-flex text-sm font-bold text-brand-blue-800 hover:underline">View payment history</Link>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-950 p-5 text-white">
              <h2 className="font-black text-white">Credential Pathway</h2>
              <div className="mt-4 space-y-3 text-sm">
                <PathStep label="Complete all lessons" done={isComplete} />
                <PathStep label="Complete assessments" done={recentQuizAttempts.some((attempt: any) => attempt.passed)} />
                <PathStep label="Earn certification" done={certifications.length > 0} />
              </div>
            </section>
          </aside>
        </div>
      </div>

      {activeCourseIsAvailable ? (
        <ParisFloatingWrapper
          surface="learner"
          courseProgress={courseProgress}
          {...(activeCourse?.title ? { courseTitle: activeCourse.title } : {})}
          {...(nextLesson?.title ? { nextLessonTitle: nextLesson.title } : {})}
        />
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}

function PathStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? 'bg-green-600' : 'bg-slate-700'}`}>
        {done ? <CheckCircle className="h-3 w-3" /> : null}
      </div>
      <span className={done ? 'font-medium text-green-200' : 'font-medium text-slate-100'}>{label}</span>
    </div>
  );
}
