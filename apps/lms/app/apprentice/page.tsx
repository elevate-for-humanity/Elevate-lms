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

type HourRow = {
  accepted_hours: number | string | null;
  hours: number | string | null;
  hours_claimed: number | string | null;
  status: string | null;
  approval_status: string | null;
  host_shop_id: string | null;
  program_slug: string | null;
};

function numericHours(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');

  const [profileRes, enrollmentRes, placementRes, docsRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, first_name, last_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('program_enrollments')
      .select('id, program_slug, enrollment_state, orientation_completed_at, documents_submitted_at, access_granted_at, course_id, programs(min_ojl_hours, min_rti_hours)')
      .eq('user_id', user.id)
      .eq('program_slug', programSlug)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('apprentice_placements')
      .select('id, student_id, shop_id, program_slug, status, start_date')
      .eq('student_id', user.id)
      .eq('program_slug', programSlug)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('documents').select('id, status, verification_status').eq('user_id', user.id),
    supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const enrollment = enrollmentRes.data;
  const placement = placementRes.data;
  const programConfig = enrollment?.programs as { min_ojl_hours?: number | null; min_rti_hours?: number | null } | null;

  const { data: hourRows, error: hourError } = await supabase
    .from('hour_entries')
    .select('accepted_hours, hours, hours_claimed, status, approval_status, host_shop_id, program_slug')
    .eq('user_id', user.id);
  if (hourError) throw new Error(`APPRENTICE_HOURS_LOAD_FAILED:${hourError.message}`);

  const scopedHours = ((hourRows ?? []) as HourRow[]).filter((row) => {
    if (placement?.shop_id && row.host_shop_id && row.host_shop_id !== placement.shop_id) return false;
    if (row.program_slug && row.program_slug !== programSlug) return false;
    return true;
  });

  const approvedHours = scopedHours
    .filter((row) => row.approval_status === 'approved' || row.status === 'approved')
    .reduce(
      (sum, row) =>
        sum +
        (numericHours(row.accepted_hours) || numericHours(row.hours) || numericHours(row.hours_claimed)),
      0,
    );
  const pendingEntries = scopedHours.filter(
    (row) => row.approval_status === 'pending' || row.status === 'pending',
  ).length;

  const configuredOjlHours = Number(programConfig?.min_ojl_hours ?? 0);
  const requiredOjlHours = configuredOjlHours > 0 ? configuredOjlHours : null;
  const ojtProgress = requiredOjlHours
    ? Math.min(100, Math.max(0, Math.round((approvedHours / requiredOjlHours) * 100)))
    : 0;

  let totalRtiLessons = 0;
  let completedRtiLessons = 0;
  let courseTitle = 'Assigned RTI course';

  if (enrollment?.course_id) {
    const [courseRes, lessonCountRes, progressCountRes] = await Promise.all([
      supabase.from('courses').select('title').eq('id', enrollment.course_id).maybeSingle(),
      supabase.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', enrollment.course_id),
      supabase
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('course_id', enrollment.course_id)
        .eq('completed', true),
    ]);
    courseTitle = courseRes.data?.title || courseTitle;
    totalRtiLessons = lessonCountRes.count ?? 0;
    completedRtiLessons = progressCountRes.count ?? 0;
  }

  const rtiProgress = totalRtiLessons > 0
    ? Math.min(100, Math.max(0, Math.round((completedRtiLessons / totalRtiLessons) * 100)))
    : 0;
  const requiredRtiHours = Number(programConfig?.min_rti_hours ?? 0) || null;

  let shopName: string | null = null;
  if (placement?.shop_id) {
    const { data: shop } = await supabase.from('shops').select('name').eq('id', placement.shop_id).maybeSingle();
    shopName = shop?.name ?? null;
  }

  const verifiedDocs = (docsRes.data ?? []).filter((doc) =>
    ['approved', 'verified'].includes(String(doc.verification_status || doc.status || '').toLowerCase()),
  ).length;
  const totalDocs = docsRes.data?.length ?? 0;
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Apprentice';
  const displayProgram = programSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

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
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Apprentice Dashboard</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome, {firstName}</h1>
            <p className="mt-3 text-lg font-bold text-slate-800">{displayProgram}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Status: {enrollment?.enrollment_state || placement?.status || 'Active record'}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Host Shop: {shopName || 'Not assigned'}</span>
            </div>
          </div>
          <Link href="/apprentice/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-900 hover:bg-slate-50"><UserRound className="h-5 w-5" /> Profile</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Apprentice progress">
        <Metric label="Approved OJT hours" value={requiredOjlHours ? `${approvedHours.toLocaleString()} / ${requiredOjlHours.toLocaleString()}` : approvedHours.toLocaleString()} detail={`${ojtProgress}% of required OJT`} icon={Clock3} />
        <Metric label="RTI lessons complete" value={`${completedRtiLessons} / ${totalRtiLessons}`} detail={requiredRtiHours ? `${requiredRtiHours} minimum RTI hours required by program` : `${rtiProgress}% verified lesson completion`} icon={BookOpen} />
        <Metric label="Pending hour entries" value={String(pendingEntries)} detail="Awaiting supervisor/admin review" icon={CheckCircle2} />
        <Metric label="Certificates earned" value={String(certsRes.count ?? 0)} detail={`${verifiedDocs} of ${totalDocs} documents verified`} icon={Award} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <ProgressPanel title="On-the-job learning (OJT)" value={ojtProgress} detail={requiredOjlHours ? `${approvedHours.toLocaleString()} approved of ${requiredOjlHours.toLocaleString()} required hours` : `${approvedHours.toLocaleString()} approved hours recorded`} />
        <ProgressPanel title="Related Technical Instruction (RTI)" value={rtiProgress} detail={`${completedRtiLessons} verified lessons complete of ${totalRtiLessons}`} />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-black text-slate-950">Your workspaces</h2>
          <p className="mt-1 text-sm text-slate-700">Each workspace uses the same apprentice enrollment and placement records shown above.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ title, text, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-red-300 hover:shadow-md">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-brand-red-700">Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      {!shopName && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <div className="flex gap-3">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h2 className="font-black">Host shop assignment needed</h2>
              <p className="mt-1 text-sm leading-6">Your active apprentice placement does not currently resolve to a host shop. Contact apprenticeship administration before recording location-dependent OJT.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function ProgressPanel({ title, value, detail }: { title: string; value: number; detail: string }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-700">{detail}</p>
        </div>
        <span className="text-2xl font-black text-slate-950">{value}%</span>
      </div>
      <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-red-600" style={{ width: `${value}%` }} />
      </div>
    </section>
  );
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ElementType }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><Icon className="h-5 w-5" /></div>
      <p className="mt-4 text-sm font-bold text-slate-700">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}
