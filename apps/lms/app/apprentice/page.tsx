import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, BookOpen, CheckCircle2, Clock3, ShieldCheck, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { courseOverviewPath } from '@/lib/lms/routes';
import { getProgramHeroImage } from '@/lib/images/programImages';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
import { resolveApplicableWage } from '@/lib/apprenticeship/registered-program-contract';

export const metadata: Metadata = { title: 'Apprentice Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');

  const db = await requireAdminClient();
  const runtime = await resolveApprenticeshipRuntimeContext(db, {
    userId: user.id,
    programSlug,
    requireRegisteredStandard: false,
  });
  if (!runtime) redirect('/lms/dashboard?notice=apprentice-enrollment-required');

  const [{ data: profile }, { data: docs }, certsRes] = await Promise.all([
    db.from('profiles').select('full_name,first_name,last_name').eq('id', user.id).maybeSingle(),
    db.from('documents').select('id,status,verification_status').eq('user_id', user.id),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Apprentice';
  const displayProgram = runtime.contract?.standard.occupationTitle || programSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const heroImage = getProgramHeroImage(programSlug);
  const verifiedDocs = (docs || []).filter((doc) => ['approved', 'verified'].includes(String(doc.verification_status || doc.status || '').toLowerCase())).length;
  const totalDocs = docs?.length ?? 0;

  let courseTitle = 'Assigned RTI course';
  let courseHref = '/lms/courses';
  let totalLessons = 0;
  let completedLessons = 0;
  if (runtime.enrollment.course_id) {
    const [courseRes, lessonCountRes, progressCountRes] = await Promise.all([
      db.from('courses').select('title,slug').eq('id', runtime.enrollment.course_id).maybeSingle(),
      db.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', runtime.enrollment.course_id).eq('is_published', true),
      db.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', runtime.enrollment.course_id).eq('completed', true),
    ]);
    courseTitle = courseRes.data?.title || courseTitle;
    courseHref = courseOverviewPath(runtime.enrollment.course_id);
    totalLessons = lessonCountRes.count ?? 0;
    completedLessons = progressCountRes.count ?? 0;
  }
  const digitalCoursePercent = totalLessons ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

  if (!runtime.contract) {
    return <main className="space-y-7 pb-10">
      <section className="min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:min-h-[400px]"><div className="grid min-h-[320px] lg:min-h-[400px] lg:grid-cols-[1.15fr_0.85fr]"><div className="p-6 sm:p-8"><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Apprentice Dashboard</p><h1 className="mt-2 text-3xl font-black text-slate-950">Welcome, {firstName}</h1><p className="mt-3 text-lg font-bold text-slate-800">{displayProgram}</p><div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">Your enrollment exists, but this occupation does not currently have an active approved registered-program standard in the canonical platform contract. Regulated OJL, competency, RTI-credit, wage-progression, and completion actions are blocked rather than filled with generic or historical defaults.</div><div className="mt-5 flex flex-wrap gap-3"><Link href="/apprentice/documents" className="rounded-xl border border-slate-300 px-4 py-2 font-bold">Documents</Link><Link href="/apprentice/profile" className="rounded-xl border border-slate-300 px-4 py-2 font-bold">Profile</Link></div></div><div className="relative min-h-[240px]"><Image src={heroImage} alt={`${displayProgram} apprentice training`} fill priority className="object-cover" sizes="(max-width:1024px) 100vw,40vw" /></div></div></section>
    </main>;
  }

  const progress = await loadRegisteredApprenticeshipProgress(db, runtime);
  const wage = resolveApplicableWage(runtime.contract, progress.competencies.completed);
  const nextWageMilestone = runtime.contract.standard.wageMilestones.find((step) => step.completedCompetencies > progress.competencies.completed) || null;
  const shopName = runtime.contract.employer?.name || runtime.shop?.name || 'Not assigned';
  const supervisorName = runtime.supervisor?.full_name || runtime.supervisor?.email || 'Not assigned';
  const placementReady = Boolean(runtime.placement?.id && runtime.placement.supervisor_user_id && runtime.shop?.active !== false && runtime.partner?.approval_status === 'approved' && runtime.partner?.verification_status === 'verified' && runtime.partner?.mou_signed && runtime.partner?.onboarding_completed);

  const actions = [
    { title: 'Clock work hours', text: 'Record geofenced supervised work time for Host Shop review. OJL hours remain evidence; competency verification controls competency-based progression.', href: '/apprentice/timeclock', image: '/images/pages/apprenticeship-structure.webp' },
    { title: 'Open RTI course', text: `${courseTitle} · ${digitalCoursePercent}% digital lesson completion`, href: courseHref, image: '/images/pages/training-classroom.webp' },
    { title: 'Competencies', text: `Review all ${runtime.contract.completion.competencyCount} registered competencies and supervisor verification.`, href: '/apprentice/competencies', image: '/images/pages/competency-test-hero.webp' },
    { title: 'Documents', text: 'Review required agreements, signatures, transfer evidence, and verified records.', href: '/apprentice/documents', image: '/images/pages/comp-home-highlight-success.webp' },
  ] as const;

  return <main className="space-y-7 pb-10">
    <section className="min-h-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:min-h-[400px]"><div className="grid min-h-[320px] lg:min-h-[400px] lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch"><div className="p-6 sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Apprentice Dashboard</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome, {firstName}</h1><p className="mt-3 text-lg font-bold text-slate-800">{runtime.contract.standard.occupationTitle} Registered Apprenticeship</p><div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Status: {runtime.enrollment.enrollment_state || runtime.enrollment.status || 'Active record'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Host Shop: {shopName}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Supervisor: {supervisorName}</span><span className="rounded-full bg-cyan-100 px-3 py-1.5 text-cyan-900">RAPIDS {runtime.contract.standard.rapidsCode} · competency-based</span></div></div><Link href="/apprentice/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-900 hover:bg-slate-50"><UserRound className="h-5 w-5" /> Profile</Link></div></div><div className="relative min-h-[230px] lg:min-h-full"><Image src={heroImage} alt={`${displayProgram} apprentice training`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /></div></div></section>

    <section className={`rounded-2xl border p-5 ${placementReady ? 'border-cyan-200 bg-cyan-50 text-cyan-950' : 'border-amber-300 bg-amber-50 text-amber-950'}`}><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 className="font-black">Registered-program contract</h2><p className="mt-1 text-sm font-semibold leading-6">Completion requires {runtime.contract.completion.competencyCount} verified competencies and {runtime.contract.completion.requiredRtiHours} verified RTI hours under the active registered standard. Digital lesson completion is learning progress, not automatic RTI credit. Approved OJL remains auditable supervised-work evidence and is not used as a fabricated fixed completion denominator.</p><p className="mt-2 text-xs font-bold uppercase tracking-wide">{runtime.contract.standard.apprenticeToMentorRatio} mentor ratio · {runtime.contract.standard.probationaryHours}-hour probation · standard {runtime.contract.standardVersionKey}</p>{!placementReady ? <p className="mt-2 text-sm font-black">Regulated activity remains blocked until the Host Shop and assigned supervisor are fully operational.</p> : null}</div></div></section>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Apprentice progress"><Metric label="Registered competencies" value={`${progress.competencies.completed} / ${progress.competencies.required}`} detail={`${progress.competencies.percent}% verified competency progress`} icon={CheckCircle2} /><Metric label="Verified RTI hours" value={`${progress.rti.verifiedHours.toFixed(2)} / ${progress.rti.requiredHours}`} detail={`${progress.rti.percent}% verified RTI · ${progress.rti.pendingEntries} pending entries`} icon={BookOpen} /><Metric label="Approved OJL evidence" value={progress.ojl.approvedHours.toLocaleString()} detail={`${progress.ojl.pendingEntries} pending work entries · not a completion denominator`} icon={Clock3} /><Metric label="Certificates / documents" value={String(certsRes.count ?? 0)} detail={`${verifiedDocs} of ${totalDocs} documents verified`} icon={Award} /></section>

    <section className="grid gap-5 lg:grid-cols-3"><ProgressPanel title="Registered competency mastery" value={progress.competencies.percent} detail={`${progress.competencies.completed} of ${progress.competencies.required} competencies verified`} /><ProgressPanel title="Verified Related Technical Instruction" value={progress.rti.percent} detail={`${progress.rti.verifiedHours.toFixed(2)} verified of ${progress.rti.requiredHours} required RTI hours`} /><ProgressPanel title="Digital course completion" value={digitalCoursePercent} detail={`${completedLessons} of ${totalLessons} published lessons complete; this does not itself award RTI credit`} /></section>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black text-slate-950">Progressive wage checkpoint</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-700">The applicable wage floor resolves the immutable occupation baseline and any employer-specific RAPIDS wage schedule without flattening one employer&apos;s schedule into the occupation standard.</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-slate-100 px-3 py-2">Current registered floor: ${wage.requiredRegisteredRate.toFixed(2)}/hr</span>{nextWageMilestone ? <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-950">Next baseline milestone: {nextWageMilestone.completedCompetencies} competencies → ${nextWageMilestone.hourlyRate.toFixed(2)}/hr</span> : <span className="rounded-full bg-green-100 px-3 py-2 text-green-950">Final baseline competency milestone reached</span>}</div></section>

    <section><div className="mb-4"><h2 className="text-2xl font-black text-slate-950">Apprentice tools</h2><p className="mt-1 text-sm font-medium text-slate-700">All tools use the same enrollment, placement, Host Shop, registered standard, and audit records.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{actions.map((action) => <Link key={action.title} href={action.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-red-300 hover:shadow-md"><div className="relative aspect-[16/9] overflow-hidden bg-slate-100"><Image src={action.image} alt="" fill sizes="(max-width:640px) 100vw,25vw" className="object-cover transition-transform group-hover:scale-[1.03]" /></div><div className="p-5"><h3 className="font-black text-slate-950">{action.title}</h3><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{action.text}</p></div></Link>)}</div></section>
  </main>;
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType<{ className?: string }> }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-5 w-5 text-brand-red-700"/><p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{detail}</p></article>;
}

function ProgressPanel({ title, value, detail }: { title: string; value: number; detail: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><h3 className="font-black text-slate-950">{title}</h3><span className="text-sm font-black text-slate-800">{value}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div><p className="mt-3 text-sm font-medium leading-6 text-slate-700">{detail}</p></article>;
}
