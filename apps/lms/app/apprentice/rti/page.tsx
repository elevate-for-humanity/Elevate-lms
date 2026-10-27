import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { APPRENTICE_ROLES } from '@/lib/rbac/role-matrix';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Verified RTI | Apprentice', description: 'Track documented Related Technical Instruction against the active registered-program standard.', robots: { index: false, follow: false } };

async function resolveCurrentRuntime(userId: string) {
  const db = await requireAdminClient();
  const runtime = await resolveApprenticeshipRuntimeContext(db, { userId, requireRegisteredStandard: false });
  return { db, runtime };
}

async function submitRtiEvidence(formData: FormData) {
  'use server';
  const { user } = await requireRole(APPRENTICE_ROLES);
  const { db, runtime } = await resolveCurrentRuntime(user.id);
  if (!runtime?.contract) throw new Error('REGISTERED_PROGRAM_CONTRACT_REQUIRED');

  const requirementId = String(formData.get('requirementId') || '').trim();
  const instructionDate = String(formData.get('instructionDate') || '').trim();
  const deliveryMethod = String(formData.get('deliveryMethod') || '').trim();
  const minutesClaimed = Number(formData.get('minutesClaimed') || 0);
  const evidenceUrl = String(formData.get('evidenceUrl') || '').trim().slice(0, 2000) || null;
  const evidenceNotes = String(formData.get('evidenceNotes') || '').trim().slice(0, 4000) || null;
  if (!requirementId || !instructionDate) throw new Error('RTI_CATEGORY_AND_DATE_REQUIRED');
  if (!['lms', 'classroom', 'live_virtual', 'lab', 'external_approved'].includes(deliveryMethod)) throw new Error('INVALID_RTI_DELIVERY_METHOD');
  if (!Number.isFinite(minutesClaimed) || minutesClaimed <= 0 || minutesClaimed > 720) throw new Error('INVALID_RTI_MINUTES');

  const { data: requirement } = await db.from('apprenticeship_rti_requirements').select('id,standard_key')
    .eq('id', requirementId).eq('standard_key', runtime.contract.standardVersionKey).maybeSingle();
  if (!requirement) throw new Error('INVALID_RTI_CATEGORY');

  const { error } = await db.from('apprenticeship_rti_entries').insert({
    enrollment_id: runtime.enrollment.id,
    user_id: user.id,
    standard_key: runtime.contract.standardVersionKey,
    requirement_id: requirement.id,
    instruction_date: instructionDate,
    delivery_method: deliveryMethod,
    minutes_claimed: Math.round(minutesClaimed),
    evidence_url: evidenceUrl,
    evidence_notes: evidenceNotes,
    status: 'pending',
  });
  if (error) throw new Error(`RTI_SUBMISSION_FAILED:${error.message}`);
  revalidatePath('/apprentice/rti');
  revalidatePath('/apprentice');
}

export default async function ApprenticeRtiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/rti');
  const runtime = await resolveApprenticeshipRuntimeContext(db, { userId: subject.userId, requireRegisteredStandard: false });
  if (!runtime) redirect('/apprentice');
  if (!runtime.contract) {
    return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><Link href="/apprentice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-4 w-4"/>Back to dashboard</Link><div role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950"><h1 className="text-2xl font-black">RTI credit is blocked</h1><p className="mt-2 font-semibold leading-6">This enrollment does not have an active approved registered-program standard in the canonical contract. The system will not substitute a generic RTI total.</p></div></main>;
  }

  const [progress, requirementsResult, entriesResult] = await Promise.all([
    loadRegisteredApprenticeshipProgress(db, runtime),
    db.from('apprenticeship_rti_requirements').select('id,title,required_hours,display_order').eq('standard_key', runtime.contract.standardVersionKey).order('display_order'),
    db.from('apprenticeship_rti_entries').select('id,requirement_id,instruction_date,delivery_method,minutes_claimed,minutes_verified,status,evidence_notes,evidence_url,submitted_at:created_at,verified_at,rejection_reason').eq('enrollment_id', runtime.enrollment.id).eq('standard_key', runtime.contract.standardVersionKey).order('instruction_date', { ascending: false }).limit(100),
  ]);
  if (requirementsResult.error) throw new Error(`RTI_REQUIREMENTS_LOAD_FAILED:${requirementsResult.error.message}`);
  if (entriesResult.error) throw new Error(`RTI_ENTRIES_LOAD_FAILED:${entriesResult.error.message}`);

  const requirements = requirementsResult.data || [];
  const entries = entriesResult.data || [];
  const verifiedMinutesByRequirement = new Map<string, number>();
  const pendingByRequirement = new Map<string, number>();
  for (const entry of entries) {
    if (entry.status === 'verified' || entry.status === 'approved') {
      verifiedMinutesByRequirement.set(entry.requirement_id, (verifiedMinutesByRequirement.get(entry.requirement_id) || 0) + Number(entry.minutes_verified || 0));
    } else if (entry.status !== 'rejected') {
      pendingByRequirement.set(entry.requirement_id, (pendingByRequirement.get(entry.requirement_id) || 0) + 1);
    }
  }
  const rows = requirements.map((requirement) => {
    const verifiedHours = Math.round(((verifiedMinutesByRequirement.get(requirement.id) || 0) / 60) * 100) / 100;
    const requiredHours = Number(requirement.required_hours || 0);
    return {
      ...requirement,
      verifiedHours,
      remainingHours: Math.max(0, Math.round((requiredHours - verifiedHours) * 100) / 100),
      pendingEntries: pendingByRequirement.get(requirement.id) || 0,
      requirementMet: verifiedHours >= requiredHours,
    };
  });
  const metCount = rows.filter((row) => row.requirementMet).length;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <Link href="/apprentice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-red-700">{runtime.contract.standard.occupationTitle} · RAPIDS {runtime.contract.standard.rapidsCode}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Verified Related Technical Instruction</h1><p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">Document instruction against the active {runtime.contract.completion.requiredRtiHours}-hour RTI requirement. Lesson completion alone does not create RTI credit; evidence remains pending until authorized verification.</p><p className="mt-2 text-xs font-bold text-slate-500">Standard version: {runtime.contract.standardVersionKey}</p></div><div className="rounded-2xl bg-slate-950 px-5 py-4 text-white"><p className="text-xs font-bold uppercase tracking-wide text-slate-300">Verified RTI</p><p className="mt-1 text-2xl font-black">{progress.rti.verifiedHours.toFixed(2)} / {progress.rti.requiredHours} hrs</p><p className="mt-1 text-xs text-slate-300">{metCount}/{rows.length} categories satisfied · {progress.rti.pendingEntries} pending</p></div></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${progress.rti.percent}%` }} /></div></section>

    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{rows.map((row) => { const categoryPct = row.required_hours ? Math.min(100, Math.round((row.verifiedHours / Number(row.required_hours)) * 100)) : 0; return <article key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><BookOpen className="h-5 w-5 text-brand-red-700" />{row.requirementMet ? <CheckCircle2 className="h-5 w-5 text-brand-green-700" /> : null}</div><h2 className="mt-3 font-black leading-5 text-slate-950">{row.title}</h2><p className="mt-2 text-sm font-bold text-slate-700">{row.verifiedHours.toFixed(2)} / {row.required_hours} hours verified</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${categoryPct}%` }} /></div><p className="mt-2 text-xs text-slate-500">{row.remainingHours.toFixed(2)} hours remaining · {row.pendingEntries} pending</p></article>; })}</section>

    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-start gap-3"><FileCheck2 className="mt-1 h-5 w-5 text-brand-red-700"/><div><h2 className="text-xl font-black text-slate-950">Submit RTI evidence</h2><p className="mt-1 text-sm text-slate-600">Enter actual instructional time. Do not enter work-shift/OJL time here.</p></div></div>{subject.previewing ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">Admin preview is read-only. This learner can submit RTI evidence from their own account.</p> : <form action={submitRtiEvidence} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">Registered RTI category<select name="requirementId" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-medium"><option value="">Select category</option>{rows.map((row) => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label><label className="text-sm font-bold text-slate-700">Instruction date<input name="instructionDate" type="date" required max={new Date().toISOString().slice(0, 10)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="text-sm font-bold text-slate-700">Delivery method<select name="deliveryMethod" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-medium"><option value="lms">LMS / online instruction</option><option value="classroom">Classroom</option><option value="live_virtual">Live virtual class</option><option value="lab">Instructor-led lab</option><option value="external_approved">Approved external instruction</option></select></label><label className="text-sm font-bold text-slate-700">Instruction minutes<input name="minutesClaimed" type="number" required min={1} max={720} step={1} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" placeholder="60" /></label><label className="text-sm font-bold text-slate-700 md:col-span-2">Evidence link (optional)<input name="evidenceUrl" type="url" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" placeholder="https://..." /></label><label className="text-sm font-bold text-slate-700 md:col-span-2">Instruction/evidence notes<textarea name="evidenceNotes" rows={4} className="mt-1 w-full rounded-xl border border-slate-300 p-3" placeholder="Instructor, topic, assignment, class session, or supporting evidence details." /></label><div className="md:col-span-2"><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-2.5 font-black text-white hover:bg-brand-red-800"><ShieldCheck className="h-4 w-4" /> Submit for RTI verification</button></div></form>}</section>

    <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-6 py-4"><h2 className="text-xl font-black text-slate-950">RTI evidence history</h2></div>{!entries.length ? <div className="px-6 py-10 text-center text-sm text-slate-500">No RTI evidence has been submitted yet.</div> : <div className="divide-y divide-slate-200">{entries.map((entry) => { const requirement = rows.find((row) => row.id === entry.requirement_id); return <div key={entry.id} className="px-6 py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black text-slate-950">{requirement?.title || 'RTI category'}</p><p className="mt-1 text-sm text-slate-600">{entry.instruction_date} · {String(entry.delivery_method).replace(/_/g, ' ')} · {entry.minutes_claimed} minutes claimed</p>{entry.evidence_notes ? <p className="mt-2 text-sm text-slate-700">{entry.evidence_notes}</p> : null}{entry.rejection_reason ? <p className="mt-2 text-sm font-semibold text-red-700">Rejected: {entry.rejection_reason}</p> : null}</div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400"/><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${entry.status === 'verified' || entry.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : entry.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{entry.status}</span>{entry.status === 'verified' || entry.status === 'approved' ? <span className="text-xs font-bold text-slate-700">{entry.minutes_verified} verified min</span> : null}</div></div></div>; })}</div>}</section>
  </main>;
}
