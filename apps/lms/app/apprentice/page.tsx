import type { ElementType } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  Scissors,
  UserRound,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { courseOverviewPath } from '@/lib/lms/routes';

export const metadata: Metadata = {
  title: 'Apprentice Dashboard',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

type HourEntry = {
  accepted_hours: number | string | null;
  hours: number | string | null;
  hours_claimed: number | string | null;
  status: string | null;
  approval_status: string | null;
  host_shop_id: string | null;
};

function positiveNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function acceptedHours(row: HourEntry): number {
  const approved = row.approval_status === 'approved' || row.status === 'approved';
  if (!approved) return 0;
  return positiveNumber(row.accepted_hours) || positiveNumber(row.hours) || positiveNumber(row.hours_claimed);
}

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login?redirect=/apprentice');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');

  const [profileRes, enrollmentRes, placementRes, hoursRes, docsRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, first_name, last_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('program_enrollments')
      .select('id, program_id, program_slug, enrollment_state, progress_percent, course_id, programs(min_ojl_hours)')
      .eq('user_id', user.id)
      .eq('program_slug', programSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('apprentice_placements')
      .select('id, shop_id, status, start_date')
      .eq('student_id', user.id)
      .eq('program_slug', programSlug)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('hour_entries')
      .select('accepted_hours, hours, hours_claimed, status, approval_status, host_shop_id')
      .eq('user_id', user.id)
      .eq('program_slug', programSlug),
    supabase.from('documents').select('id, status, verification_status').eq('user_id', user.id),
    supabase
      .from('program_completion_certificates')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const enrollment = enrollmentRes.data;
  const placement = placementRes.data;
  const hourRows = (hoursRes.data ?? []) as HourEntry[];

  const approvedOjtHours = hourRows.reduce((sum, row) => sum + acceptedHours(row), 0);
  const pendingHourEntries = hourRows.filter(
    (row) => row.approval_status === 'pending' || row.status === 'pending',
  ).length;
  const configuredOjlHours = Number(
    (enrollment?.programs as { min_ojl_hours?: number | null } | null)?.min_ojl_hours ?? 0,
  );
  const requiredOjtHours = configuredOjlHours > 0 ? configuredOjlHours : null;
  const ojtProgress = requiredOjtHours
    ? Math.min(100, Math.max(0, Math.round((approvedOjtHours / requiredOjtHours) * 100)))
    : null;

  let shopName: string | null = null;
  if (placement?.shop_id) {
    const { data: shop } = await supabase
      .from('shops')
      .select('name')
      .eq('id', placement.shop_id)
      .maybeSingle();
    shopName = shop?.name ?? null;
  }

  let courseTitle = 'Assigned RTI course';
  let totalLessons = 0;
  let completedLessons = 0;
  let trackedLessons = 0;

  if (enrollment?.course_id) {
    const [courseRes, lessonCountRes, progressRes] = await Promise.all([
      supabase.from('courses').select('title').eq('id', enrollment.course_id).maybeSingle(),
      supabase
        .from('course_lessons')
        .select('id', { count: 'exact', head: true })
        .eq('course_id', enrollment.course_id),
      supabase
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('course_id', enrollment.course_id),
    ]);

    courseTitle = courseRes.data?.title || courseTitle;
    totalLessons = lessonCountRes.count ?? 0;
    const progressRows = progressRes.data ?? [];
    trackedLessons = new Set(progressRows.map((row: any) => row.lesson_id).filter(Boolean)).size;
    completedLessons = new Set(
      progressRows.filter((row: any) => row.completed).map((row: any) => row.lesson_id).filter(Boolean),
    ).size;
  }

  const rtiProgress = totalLessons > 0 && trackedLessons > 0
    ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
    : null;
  const storedProgramProgress = Number(enrollment?.progress_percent ?? 0);

  const verifiedDocs = (docsRes.data ?? []).filter((doc: any) =>
    ['approved', 'verified'].includes(
      String(doc.verification_status || doc.status || '').toLowerCase(),
    ),
  ).length;
  const totalDocs = docsRes.data?.length ?? 0;
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Apprentice';
  const displayProgram = programSlug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const actions = [
    { title: 'Clock hours', text: 'Record and review your on-the-job training hours.', href: '/apprentice/timeclock', icon: Clock3 },
    { title: 'Open RTI course', text: courseTitle, href: enrollment?.course_id ? courseOverviewPath(enrollment.course_id) : '/apprentice/course', icon: BookOpen },
    { title: 'Competencies', text: 'Review required skills and supervisor verification.', href: '/apprentice/competencies', icon: Scissors },
    { title: 'Documents', text: 'Review required agreements and uploaded records.', href: '/apprentice/documents', icon: FileText },
  ] as const;

  return (
    <main className="space-y-7 pb-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-red-700">Apprentice Dashboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome, {firstName}</h1>
            <p className="mt-3 text-lg font-bold text-slate-800">{displayProgram}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">
                Status: {enrollment?.enrollment_state || placement?.status || 'Active record'}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">
                Host Shop: {shopName || 'Not assigned'}
              </span>
            </div>
          </div>
          <Link href="/apprentice/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-900 hover:bg-slate-50">
            <UserRound className="h-5 w-5" /> Profile
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Apprentice metrics">
        <Metric
          label="Approved OJT hours"
          value={requiredOjtHours ? `${approvedOjtHours.toLocaleString()} / ${requiredOjtHours.toLocaleString()}` : approvedOjtHours.toLocaleString()}
          detail={ojtProgress == null ? 'OJT target is not configured' : `${ojtProgress}% of OJT target`}
          icon={Clock3}
        />
        <Metric
          label="RTI lesson progress"
          value={rtiProgress == null ? 'Not recorded' : `${rtiProgress}%`}
          detail={rtiProgress == null ? 'No lesson-progress activity has been recorded for this course yet' : `${completedLessons} of ${totalLessons} lessons completed`}
          icon={BookOpen}
        />
        <Metric
          label="Pending hour entries"
          value={String(pendingHourEntries)}
          detail="Awaiting supervisor or admin review"
          icon={CheckCircle2}
        />
        <Metric
          label="Certificates earned"
          value={String(certsRes.count ?? 0)}
          detail="Program completion credentials on record"
          icon={Award}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ProgressCard
          title="OJT progress"
          value={ojtProgress}
          detail={requiredOjtHours ? `${approvedOjtHours.toLocaleString()} approved of ${requiredOjtHours.toLocaleString()} required hours` : 'Required OJT target is not configured'}
        />
        <ProgressCard
          title="RTI progress"
          value={rtiProgress}
          detail={rtiProgress == null ? 'Lesson tracking has not started; enrollment percentage is not being presented as lesson completion.' : `${completedLessons} completed lessons of ${totalLessons}`}
        />
      </section>

      {storedProgramProgress > 0 && rtiProgress == null && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
          <p className="font-black">Program record progress: {storedProgramProgress}%</p>
          <p className="mt-1 text-sm leading-6">
            This percentage is stored on the program enrollment record. It is shown separately because no lesson-progress rows currently exist for this RTI course; it is not being represented as completed lessons.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-black text-slate-950">Your workspaces</h2>
        <p className="mt-1 text-sm text-slate-700">One canonical apprentice workspace for OJT, RTI, competencies, and documents.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ title, text, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-red-700">Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-slate-700" />
          <p className="font-black text-slate-950">Verified documents: {verifiedDocs} / {totalDocs}</p>
        </div>
      </section>

      {!shopName && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-black">Host shop assignment needed</h2>
              <p className="mt-1 text-sm leading-6">Your active placement does not currently resolve to a host shop. Contact apprenticeship administration before recording location-dependent OJT.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: ElementType }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-sm font-bold text-slate-700">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}

function ProgressCard({ title, value, detail }: { title: string; value: number | null; detail: string }) {
  const width = value == null ? 0 : value;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <span className="text-xl font-black text-slate-950">{value == null ? '—' : `${value}%`}</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value ?? 0} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-red-700" style={{ width: `${width}%` }} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-700">{detail}</p>
    </article>
  );
}
