import type { ElementType } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  GraduationCap,
  MessageSquare,
  Play,
} from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { NotificationBell } from '@/components/lms/NotificationBell';
import { GlobalSearch } from '@/components/lms/GlobalSearch';
import WorkOneChecklistSection from '@/components/workone/WorkOneChecklist';

export const metadata: Metadata = {
  title: 'Student Dashboard',
  description: 'Your learning dashboard — courses, verified lesson progress, programs, and credentials.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type CourseEnrollmentRow = {
  id: string;
  course_id: string | null;
  status: string | null;
  progress: string | null;
  created_at: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
};

function numericPercent(value: unknown): number {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export default async function StudentDashboard() {
  const { user, profile } = await requireRole(['student', 'admin', 'super_admin']);
  const supabase = await createClient();

  const [
    programEnrollmentsRes,
    courseEnrollmentsRes,
    certificationsRes,
    workoneAppRes,
    quizAttemptsRes,
    applicationsRes,
    messagesRes,
  ] = await Promise.all([
    supabase
      .from('program_enrollments')
      .select('id, status, enrollment_state, enrolled_at, progress_percent, program_id, program_slug, course_id, programs(id, title, slug)')
      .eq('user_id', user.id)
      .order('enrolled_at', { ascending: false }),
    supabase
      .from('course_enrollments')
      .select('id, course_id, status, progress, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('certificates')
      .select('id, course_title, issued_at, verification_code')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .order('issued_at', { ascending: false })
      .limit(8),
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
      .select('id, score, passed, completed_at, quizzes(title)')
      .eq('user_uuid', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(5),
    supabase
      .from('applications')
      .select('id, status, program_slug, funding_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('messages')
      .select('id, subject, body, created_at, read')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  if (programEnrollmentsRes.error) {
    throw new Error(`PROGRAM_ENROLLMENTS_LOAD_FAILED:${programEnrollmentsRes.error.message}`);
  }
  if (courseEnrollmentsRes.error) {
    throw new Error(`COURSE_ENROLLMENTS_LOAD_FAILED:${courseEnrollmentsRes.error.message}`);
  }

  const programEnrollments = programEnrollmentsRes.data ?? [];
  const courseEnrollments = (courseEnrollmentsRes.data ?? []) as CourseEnrollmentRow[];
  const courseIds = Array.from(
    new Set(courseEnrollments.map((row) => row.course_id).filter((value): value is string => Boolean(value))),
  );

  const { data: courseRows, error: courseError } = courseIds.length
    ? await supabase
        .from('courses')
        .select('id, title, description')
        .in('id', courseIds)
    : { data: [], error: null };

  if (courseError) throw new Error(`COURSES_LOAD_FAILED:${courseError.message}`);

  const courseMap = new Map<string, CourseRow>(
    ((courseRows ?? []) as CourseRow[]).map((course) => [course.id, course]),
  );
  const activeCourseEnrollment =
    courseEnrollments.find((row) => row.status === 'active') ?? courseEnrollments[0] ?? null;
  const activeCourseId = activeCourseEnrollment?.course_id ?? null;
  const activeCourse = activeCourseId ? courseMap.get(activeCourseId) ?? null : null;

  let totalLessons = 0;
  let completedLessons = 0;
  let trackedLessons = 0;
  let nextLesson: { id: string; title: string; duration_minutes: number | null } | null = null;

  if (activeCourseId) {
    const [lessonsRes, progressRes] = await Promise.all([
      supabase
        .from('course_lessons')
        .select('id, title, duration_minutes, order_index')
        .eq('course_id', activeCourseId)
        .order('order_index', { ascending: true }),
      supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', activeCourseId),
    ]);

    if (lessonsRes.error) throw new Error(`COURSE_LESSONS_LOAD_FAILED:${lessonsRes.error.message}`);
    if (progressRes.error) throw new Error(`LESSON_PROGRESS_LOAD_FAILED:${progressRes.error.message}`);

    const lessons = lessonsRes.data ?? [];
    const progressRows = progressRes.data ?? [];
    const completedSet = new Set(
      progressRows.filter((row: any) => row.completed).map((row: any) => row.lesson_id),
    );
    const trackedSet = new Set(progressRows.map((row: any) => row.lesson_id).filter(Boolean));

    totalLessons = lessons.length;
    completedLessons = completedSet.size;
    trackedLessons = trackedSet.size;
    const candidate = lessons.find((lesson: any) => !completedSet.has(lesson.id)) ?? null;
    if (candidate) {
      nextLesson = {
        id: candidate.id,
        title: candidate.title || 'Next lesson',
        duration_minutes: candidate.duration_minutes ?? null,
      };
    }
  }

  const verifiedLessonProgress =
    totalLessons > 0 && trackedLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : null;
  const storedCourseProgress = numericPercent(activeCourseEnrollment?.progress);
  const activeProgramEnrollment =
    programEnrollments.find((row: any) => ['active', 'enrolled', 'in_progress'].includes(String(row.enrollment_state || row.status))) ??
    programEnrollments[0] ??
    null;
  const storedProgramProgress = numericPercent(activeProgramEnrollment?.progress_percent);

  const resumeHref = activeCourseId && nextLesson
    ? `/lms/courses/${activeCourseId}/lessons/${nextLesson.id}`
    : activeCourseId
      ? `/lms/courses/${activeCourseId}`
      : '/lms/courses';
  const firstName =
    (profile as any)?.first_name ||
    (profile as any)?.full_name?.split(' ')[0] ||
    user.email?.split('@')[0] ||
    'there';
  const workoneApp = workoneAppRes.data;
  const hasApprenticeship = programEnrollments.some((row: any) =>
    String(row.program_slug || row.programs?.slug || '').includes('apprenticeship'),
  );

  const enrolledProgramIds = new Set(
    programEnrollments.map((row: any) => row.program_id).filter(Boolean),
  );
  const { data: externalCourses } = enrolledProgramIds.size
    ? await supabase
        .from('program_external_courses')
        .select('id, title, partner_name, external_url, credential_type, program_id')
        .eq('is_active', true)
        .in('program_id', Array.from(enrolledProgramIds) as string[])
        .order('sort_order', { ascending: true })
        .limit(12)
    : { data: [] };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-blue-700" />
            <span className="font-bold text-slate-950">My Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <NotificationBell />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-300">Student LMS</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Welcome, {firstName}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Course enrollment, verified lesson completion, and program progress are shown as separate data sources so the dashboard never turns a missing progress record into a false completion claim.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={resumeHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-500">
              <Play className="h-4 w-4" /> {nextLesson ? 'Continue training' : 'Open courses'}
            </Link>
            {hasApprenticeship && (
              <Link href="/apprentice" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 px-5 py-3 font-bold text-white hover:bg-white/10">
                Apprenticeship workspace <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Student progress sources">
          <Metric
            icon={BookOpen}
            label="Course enrollment"
            value={activeCourseEnrollment ? 'Active' : 'None'}
            detail={activeCourse?.title || 'No active course enrollment'}
          />
          <Metric
            icon={CheckCircle2}
            label="Verified lesson progress"
            value={verifiedLessonProgress == null ? 'Not recorded' : `${verifiedLessonProgress}%`}
            detail={verifiedLessonProgress == null ? 'lesson_progress has no activity for this course yet' : `${completedLessons} of ${totalLessons} lessons completed`}
          />
          <Metric
            icon={GraduationCap}
            label="Program record progress"
            value={`${storedProgramProgress}%`}
            detail="Stored on program_enrollments; not presented as lesson completion"
          />
          <Metric
            icon={Award}
            label="Certificates"
            value={String(certificationsRes.data?.length ?? 0)}
            detail="Credentials currently on your record"
          />
        </section>

        {verifiedLessonProgress == null && (storedCourseProgress > 0 || storedProgramProgress > 0) && (
          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <h2 className="font-black">Progress sources are not being merged</h2>
                <p className="mt-1 text-sm leading-6">
                  The enrollment record contains a stored percentage{storedCourseProgress > 0 ? ` (${storedCourseProgress}% course record)` : ''}{storedProgramProgress > 0 ? ` (${storedProgramProgress}% program record)` : ''}, but no lesson-progress activity exists for the active course. The dashboard will not claim completed lessons until the lesson tracker records them.
                </p>
              </div>
            </div>
          </section>
        )}

        {workoneApp && (
          <WorkOneChecklistSection
            pendingWorkone={true}
            fundingSource={workoneApp.requested_funding_source ?? undefined}
          />
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">My programs</h2>
                  <p className="mt-1 text-sm text-slate-700">Program-level enrollment records.</p>
                </div>
                <Link href="/lms/courses" className="text-sm font-bold text-blue-700 hover:underline">View courses</Link>
              </div>
              <div className="mt-5 divide-y">
                {programEnrollments.length ? programEnrollments.slice(0, 6).map((enrollment: any) => {
                  const title = enrollment.programs?.title || enrollment.program_slug || 'Program';
                  const pct = numericPercent(enrollment.progress_percent);
                  return (
                    <div key={enrollment.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-950">{title}</p>
                          <p className="mt-1 text-xs text-slate-600">Status: {enrollment.enrollment_state || enrollment.status || 'recorded'}</p>
                        </div>
                        <span className="text-sm font-black text-slate-800">{pct}% program record</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full rounded-full bg-blue-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) : (
                  <p className="text-sm text-slate-600">No program enrollment is currently on record.</p>
                )}
              </div>
            </div>

            {(externalCourses ?? []).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Industry partner courses</h2>
                <div className="mt-4 divide-y">
                  {(externalCourses ?? []).map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-bold text-slate-950">{course.title}</p>
                        <p className="text-xs text-slate-600">{course.partner_name} · {course.credential_type}</p>
                      </div>
                      <a href={course.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-blue-700 hover:underline">
                        Open <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(quizAttemptsRes.data ?? []).length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black text-slate-950">Recent assessments</h2>
                <div className="mt-4 space-y-3">
                  {(quizAttemptsRes.data ?? []).map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4">
                      <span className="font-semibold text-slate-900">{attempt.quizzes?.title || 'Assessment'}</span>
                      <span className={`text-sm font-black ${attempt.passed ? 'text-green-800' : 'text-slate-700'}`}>
                        {attempt.score ?? '—'}{attempt.score != null ? '%' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            {nextLesson && activeCourseId && (
              <Action
                icon={Play}
                href={`/lms/courses/${activeCourseId}/lessons/${nextLesson.id}`}
                title="Next lesson"
                text={`${nextLesson.title}${nextLesson.duration_minutes ? ` · ~${nextLesson.duration_minutes} min` : ''}`}
              />
            )}
            <Action icon={BadgeCheck} href="/lms/certificates" title="Certificates" text="Open your credential and certificate records." />
            <Action icon={MessageSquare} href="/lms/messages" title="Messages" text={`${messagesRes.data?.filter((message: any) => !message.read).length ?? 0} unread recent messages.`} />
            <Action icon={FileText} href="/lms/apply/status" title="Applications" text={`${applicationsRes.data?.length ?? 0} recent application records.`} />
            <Action icon={Clock} href="/lms/courses" title="Course catalog" text={`${courseEnrollments.length} actual course enrollment${courseEnrollments.length === 1 ? '' : 's'} on record.`} />
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: ElementType; label: string; value: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-6 w-6 text-blue-700" />
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{label}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function Action({ icon: Icon, href, title, text }: { icon: ElementType; href: string; title: string; text: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <Icon className="h-5 w-5 text-blue-700" />
      <h2 className="mt-3 font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-700">{text}</p>
    </Link>
  );
}
