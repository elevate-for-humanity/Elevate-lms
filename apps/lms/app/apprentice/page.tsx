import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Award, BookOpen, Building2, CheckCircle2, Clock3, ShieldCheck, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { courseOverviewPath } from '@/lib/lms/routes';
import { getProgramHeroImage } from '@/lib/images/programImages';
import { getRegisteredProgramStandard, resolveRegisteredProgramContract, resolveApplicableWage } from '@/lib/apprenticeship/registered-program-contract';

export const metadata: Metadata = { title: 'Apprentice Dashboard', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type HourRow = { accepted_hours: number | string | null; hours: number | string | null; hours_claimed: number | string | null; status: string | null; approval_status: string | null; host_shop_id: string | null; program_slug: string | null };
type RtiProgressRow = { required_hours: number | string; verified_hours: number | string; pending_entries: number | string; requirement_met: boolean };
function numericHours(value: unknown) { const parsed = Number(value ?? 0); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; }

export default async function ApprenticePortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (!programSlug) redirect('/lms/dashboard?notice=apprentice-access-required');
  const registeredBase = getRegisteredProgramStandard(programSlug);
  const appendixStandard = registeredBase?.standard || null;
  const competencyBased = registeredBase?.completion.basis === 'competency';

  const [profileRes, enrollmentRes, placementRes, docsRes, certsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, first_name, last_name').eq('id', user.id).maybeSingle(),
    supabase.from('program_enrollments').select('id, program_slug, enrollment_state, orientation_completed_at, documents_submitted_at, access_granted_at, course_id, rapids_status, rapids_id, programs(min_ojl_hours, min_rti_hours)').eq('user_id', user.id).eq('program_slug', programSlug).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('apprentice_placements').select('id, student_id, shop_id, program_slug, status, start_date, supervisor_user_id').eq('student_id', user.id).eq('program_slug', programSlug).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('documents').select('id, status, verification_status').eq('user_id', user.id),
    supabase.from('program_completion_certificates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const profile = profileRes.data;
  const enrollment = enrollmentRes.data;
  const placement = placementRes.data;
  const programConfig = enrollment?.programs as { min_ojl_hours?: number | null; min_rti_hours?: number | null } | null;
  const registeredContract = enrollment?.id && registeredBase ? await resolveRegisteredProgramContract(supabase, { programSlug, enrollmentId: enrollment.id }) : null;

  const { data: hourRows, error: hourError } = await supabase.from('hour_entries').select('accepted_hours, hours, hours_claimed, status, approval_status, host_shop_id, program_slug').eq('user_id', user.id);
  if (hourError) throw new Error(`APPRENTICE_HOURS_LOAD_FAILED:${hourError.message}`);
  const scopedHours = ((hourRows ?? []) as HourRow[]).filter((row) => {
    if (placement?.shop_id && row.host_shop_id && row.host_shop_id !== placement.shop_id) return false;
    if (row.program_slug && row.program_slug !== programSlug) return false;
    return true;
  });
  const approvedHours = scopedHours.filter((row) => row.approval_status === 'approved' || row.status === 'approved').reduce((sum, row) => sum + (numericHours(row.accepted_hours) || numericHours(row.hours) || numericHours(row.hours_claimed)), 0);
  const pendingEntries = scopedHours.filter((row) => row.approval_status === 'pending' || row.status === 'pending').length;

  const configuredOjlHours = Number(programConfig?.min_ojl_hours ?? 0);
  const requiredOjlHours = !competencyBased && configuredOjlHours > 0 ? configuredOjlHours : null;
  const ojtProgress = requiredOjlHours ? Math.min(100, Math.max(0, Math.round((approvedHours / requiredOjlHours) * 100))) : 0;

  let completedCompetencies = 0;
  if (enrollment?.id && registeredBase) {
    const { data: competencyRows, error: competencyError } = await supabase.from('apprentice_competency_records').select('competency_id, completed').eq('enrollment_id', enrollment.id).eq('completed', true);
    if (competencyError) throw new Error(`APPRENTICE_COMPETENCY_LOAD_FAILED:${competencyError.message}`);
    completedCompetencies = new Set((competencyRows ?? []).map((row) => row.competency_id)).size;
  }
  const competencyProgress = registeredBase ? Math.min(100, Math.round((completedCompetencies / registeredBase.completion.competencyCount) * 100)) : 0;
  const wage = registeredContract ? resolveApplicableWage(registeredContract, completedCompetencies) : null;
  const nextWageMilestone = appendixStandard?.wageMilestones.find((step) => step.completedCompetencies > completedCompetencies) ?? null;

  let totalRtiLessons = 0;
  let completedRtiLessons = 0;
  let courseTitle = 'Assigned RTI course';
  let canonicalCourseHref = programSlug === 'barber-apprenticeship' ? '/lms/courses/barber-apprenticeship' : '/lms/courses';
  if (enrollment?.course_id) {
    const [courseRes, lessonCountRes, progressCountRes] = await Promise.all([
      supabase.from('courses').select('title,slug').eq('id', enrollment.course_id).maybeSingle(),
      supabase.from('course_lessons').select('id', { count: 'exact', head: true }).eq('course_id', enrollment.course_id).eq('is_published', true),
      supabase.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('course_id', enrollment.course_id).eq('completed', true),
    ]);
    courseTitle = courseRes.data?.title || courseTitle;
    canonicalCourseHref = courseOverviewPath(enrollment.course_id);
    totalRtiLessons = lessonCountRes.count ?? 0;
    completedRtiLessons = progressCountRes.count ?? 0;
  }
  const digitalCourseProgress = totalRtiLessons > 0 ? Math.min(100, Math.max(0, Math.round((completedRtiLessons / totalRtiLessons) * 100))) : 0;
  const requiredRtiHours = registeredBase?.completion.requiredRtiHours ?? (Number(programConfig?.min_rti_hours ?? 0) || null);

  let verifiedRtiHours = 0;
  let pendingRtiEntries = 0;
  let metRtiCategories = 0;
  let totalRtiCategories = 0;
  if (enrollment?.id && registeredBase?.standardKey === 'barber') {
    const { data: rtiRows, error: rtiError } = await supabase.from('barber_appendix_a_rti_progress').select('required_hours, verified_hours, pending_entries, requirement_met').eq('enrollment_id', enrollment.id);
    if (rtiError) throw new Error(`APPRENTICE_RTI_LOAD_FAILED:${rtiError.message}`);
    const rows = (rtiRows || []) as RtiProgressRow[];
    verifiedRtiHours = rows.reduce((sum, row) => sum + numericHours(row.verified_hours), 0);
    pendingRtiEntries = rows.reduce((sum, row) => sum + Number(row.pending_entries || 0), 0);
    metRtiCategories = rows.filter((row) => row.requirement_met).length;
    totalRtiCategories = rows.length;
  }
  const verifiedRtiProgress = requiredRtiHours ? Math.min(100, Math.max(0, Math.round((verifiedRtiHours / requiredRtiHours) * 100))) : digitalCourseProgress;

  let shopName: string | null = registeredContract?.employer?.name || null;
  if (!shopName && placement?.shop_id) {
    const { data: shop } = await supabase.from('shops').select('name').eq('id', placement.shop_id).maybeSingle();
    shopName = shop?.name ?? null;
  }

  const verifiedDocs = (docsRes.data ?? []).filter((doc) => ['approved', 'verified'].includes(String(doc.verification_status || doc.status || '').toLowerCase())).length;
  const totalDocs = docsRes.data?.length ?? 0;
  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'Apprentice';
  const displayProgram = programSlug.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const heroImage = getProgramHeroImage(programSlug);
  const actions = [
    { title: 'Clock work hours', text: 'Record geofenced work time for Host Shop review. Hours are evidence; registered competency verification controls progress.', href: '/apprentice/timeclock', image: '/images/pages/apprenticeship-structure.webp' },
    { title: 'Open RTI course', text: courseTitle, href: canonicalCourseHref, image: '/images/pages/training-classroom.webp' },
    { title: 'Competencies', text: registeredBase ? `Review all ${registeredBase.completion.competencyCount} registered competencies and supervisor verification.` : 'Review required skills and supervisor verification.', href: '/apprentice/competencies', image: '/images/pages/competency-test-hero.webp' },
    { title: 'Documents', text: 'Review required agreements, signatures, and verified records.', href: '/apprentice/documents', image: '/images/pages/comp-home-highlight-success.webp' },
  ] as const;

  return <main className="space-y-7 pb-10">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch"><div className="p-6 sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Apprentice Dashboard</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Welcome, {firstName}</h1><p className="mt-3 text-lg font-bold text-slate-800">{displayProgram}</p><div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Status: {enrollment?.enrollment_state || placement?.status || 'Active record'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-800">Host Shop: {shopName || 'Not assigned'}</span>{appendixStandard ? <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-cyan-900">RAPIDS {appendixStandard.rapidsCode} · competency-based</span> : null}</div></div><Link href="/apprentice/profile" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-slate-900 hover:bg-slate-50"><UserRound className="h-5 w-5" /> Profile</Link></div></div><div className="relative min-h-[230px] lg:min-h-full"><Image src={heroImage} alt={`${displayProgram} apprentice training`} fill priority sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /></div></div></section>

    {registeredBase ? <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 className="font-black">Your registered-program progress contract</h2><p className="mt-1 text-sm font-semibold leading-6">Completion is based on verified mastery of {registeredBase.completion.competencyCount} competencies plus {registeredBase.completion.requiredRtiHours} verified RTI hours. Digital lesson completion is learning progress; RTI credit is counted only when instruction is documented and verified. Work hours remain auditable OJL/employment evidence and are not a fabricated fixed completion denominator.</p><p className="mt-2 text-xs font-bold uppercase tracking-wide">{appendixStandard?.apprenticeToMentorRatio} mentor ratio · {appendixStandard?.probationaryHours}-hour probation · revision {registeredBase.sponsor.revisionDate}</p></div></div></section> : null}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Apprentice progress"><Metric label={registeredBase ? 'Registered competencies' : 'Approved OJT hours'} value={registeredBase ? `${completedCompetencies} / ${registeredBase.completion.competencyCount}` : requiredOjlHours ? `${approvedHours.toLocaleString()} / ${requiredOjlHours.toLocaleString()}` : approvedHours.toLocaleString()} detail={registeredBase ? `${competencyProgress}% verified competency progress` : requiredOjlHours ? `${ojtProgress}% of required OJT` : `${approvedHours.toLocaleString()} approved work hours recorded`} icon={CheckCircle2} /><Metric label={registeredBase ? 'Verified RTI hours' : 'RTI course progress'} value={registeredBase && requiredRtiHours ? `${verifiedRtiHours.toFixed(2)} / ${requiredRtiHours}` : `${completedRtiLessons} / ${totalRtiLessons}`} detail={registeredBase ? `${metRtiCategories} of ${totalRtiCategories} RTI categories satisfied · ${pendingRtiEntries} pending evidence entries` : `${digitalCourseProgress}% verified lesson completion`} icon={BookOpen} /><Metric label="Approved work hours" value={approvedHours.toLocaleString()} detail={`${pendingEntries} pending entries · retained as supervised work evidence`} icon={Clock3} /><Metric label="Certificates / documents" value={String(certsRes.count ?? 0)} detail={`${verifiedDocs} of ${totalDocs} documents verified`} icon={Award} /></section>

    <section className="grid gap-5 lg:grid-cols-2"><ProgressPanel title={registeredBase ? 'Registered competency mastery' : 'On-the-job learning (OJT)'} value={registeredBase ? competencyProgress : ojtProgress} detail={registeredBase ? `${completedCompetencies} of ${registeredBase.completion.competencyCount} competencies verified by the assigned Host Shop supervisor` : requiredOjlHours ? `${approvedHours.toLocaleString()} approved of ${requiredOjlHours.toLocaleString()} required hours` : `${approvedHours.toLocaleString()} approved hours recorded`} /><ProgressPanel title={registeredBase ? 'Verified Related Technical Instruction' : 'Digital RTI course'} value={registeredBase ? verifiedRtiProgress : digitalCourseProgress} detail={registeredBase && requiredRtiHours ? `${verifiedRtiHours.toFixed(2)} verified of ${requiredRtiHours} required RTI hours · digital course ${completedRtiLessons}/${totalRtiLessons} lessons complete` : `${completedRtiLessons} verified lessons complete of ${totalRtiLessons}`} /></section>

    {registeredBase && appendixStandard ? <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black text-slate-950">Progressive wage checkpoint</h2><p className="mt-2 text-sm font-medium leading-6 text-slate-700">The platform resolves your employer-specific RAPIDS wage schedule separately from the immutable occupation baseline. The controlling required floor is never reduced below the registered baseline.</p><div className="mt-4 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-full bg-slate-100 px-3 py-2">Current registered floor: ${Number(wage?.requiredRegisteredRate ?? appendixStandard.startingHourlyRate).toFixed(2)}/hr</span>{registeredContract?.employer?.wageSchedule ? <span className="rounded-full bg-cyan-100 px-3 py-2 text-cyan-900">Employer schedule: ${Number(registeredContract.employer.wageSchedule.startingHourlyRate || 0).toFixed(2)} start → ${Number(registeredContract.employer.wageSchedule.endingHourlyRate || 0).toFixed(2)} end</span> : null}{nextWageMilestone ? <span className="rounded-full bg-amber-100 px-3 py-2 text-amber-900">Next baseline: ${nextWageMilestone.hourlyRate.toFixed(2)}/hr at {nextWageMilestone.completedCompetencies} competencies</span> : <span className="rounded-full bg-emerald-100 px-3 py-2 text-emerald-900">Final baseline competency milestone reached</span>}</div></section> : null}

    <section><div className="mb-4"><h2 className="text-2xl font-black text-slate-950">Your workspaces</h2><p className="mt-1 text-sm font-medium text-slate-700">Each workspace uses this same enrollment, placement, RTI, competency, and compliance record.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{actions.map(({ title, text, href, image }) => <Link key={title} href={href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-red-300 hover:shadow-md"><div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100"><Image src={image} alt={`${title} workspace`} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div><div className="p-5"><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm font-medium leading-6 text-slate-700">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-brand-red-700">Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span></div></Link>)}</div></section>

    {!shopName ? <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><div className="flex gap-3"><Building2 className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-black">Host Shop assignment needed</h2><p className="mt-1 text-sm font-medium leading-6">Your active apprentice placement does not currently resolve to a Host Shop. Contact apprenticeship administration before recording location-dependent work or competency verification.</p></div></div></section> : null}
    {shopName && registeredBase && !placement?.supervisor_user_id ? <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" /><div><h2 className="font-black">Assigned supervisor required</h2><p className="mt-1 text-sm font-medium leading-6">Your Host Shop is assigned, but the active placement does not have a supervisor user attached. Regulated hours and competencies cannot be verified until the required supervisor assignment is complete.</p></div></div></section> : null}
  </main>;
}

function ProgressPanel({ title, value, detail }: { title: string; value: number; detail: string }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm font-medium text-slate-700">{detail}</p></div><span className="text-2xl font-black text-slate-950">{value}%</span></div><div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${value}%` }} /></div></section>; }
function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ElementType }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-900"><Icon className="h-5 w-5" /></div><p className="mt-4 text-sm font-bold text-slate-700">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p><p className="mt-2 text-xs font-medium leading-5 text-slate-700">{detail}</p></article>; }
