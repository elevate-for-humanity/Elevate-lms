import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, FileCheck2, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { APPRENTICE_ROLES } from '@/lib/rbac/role-matrix';
import { createClient } from '@/lib/supabase/server';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { getAppendixAStandard } from '@/lib/compliance/appendix-a-standards';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Verified RTI | Apprentice',
  description: 'Track documented Related Technical Instruction against the approved Appendix A.',
  robots: { index: false, follow: false },
};

async function submitRtiEvidence(formData: FormData) {
  'use server';

  const { user } = await requireRole(APPRENTICE_ROLES);
  const supabase = await createClient();
  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (programSlug !== 'barber-apprenticeship') throw new Error('RTI_WORKSPACE_NOT_AVAILABLE');

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id,program_slug')
    .eq('user_id', user.id)
    .eq('program_slug', programSlug)
    .in('enrollment_state', ['enrolled', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment) throw new Error('ACTIVE_ENROLLMENT_REQUIRED');

  const requirementId = String(formData.get('requirementId') || '').trim();
  const instructionDate = String(formData.get('instructionDate') || '').trim();
  const deliveryMethod = String(formData.get('deliveryMethod') || '').trim();
  const minutesClaimed = Number(formData.get('minutesClaimed') || 0);
  const evidenceUrl = String(formData.get('evidenceUrl') || '').trim().slice(0, 2000) || null;
  const evidenceNotes = String(formData.get('evidenceNotes') || '').trim().slice(0, 4000) || null;

  if (!requirementId || !instructionDate) throw new Error('RTI_CATEGORY_AND_DATE_REQUIRED');
  if (!['lms', 'classroom', 'live_virtual', 'lab', 'external_approved'].includes(deliveryMethod)) {
    throw new Error('INVALID_RTI_DELIVERY_METHOD');
  }
  if (!Number.isFinite(minutesClaimed) || minutesClaimed <= 0 || minutesClaimed > 720) {
    throw new Error('INVALID_RTI_MINUTES');
  }

  const { data: requirement } = await supabase
    .from('apprenticeship_rti_requirements')
    .select('id,standard_key')
    .eq('id', requirementId)
    .eq('standard_key', 'barber-0030cb-2025-07-10')
    .maybeSingle();
  if (!requirement) throw new Error('INVALID_RTI_CATEGORY');

  const { error } = await supabase.from('apprenticeship_rti_entries').insert({
    enrollment_id: enrollment.id,
    user_id: user.id,
    standard_key: requirement.standard_key,
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
  const { user } = await requireRole(APPRENTICE_ROLES);
  const supabase = await createClient();
  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  if (programSlug !== 'barber-apprenticeship') redirect('/apprentice');

  const standard = getAppendixAStandard(programSlug);
  if (!standard) redirect('/apprentice');

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id,course_id')
    .eq('user_id', user.id)
    .eq('program_slug', programSlug)
    .in('enrollment_state', ['enrolled', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment) redirect('/apprentice');

  const [{ data: progressRows }, { data: entries }] = await Promise.all([
    supabase
      .from('barber_appendix_a_rti_progress')
      .select('requirement_id,requirement_title,required_hours,verified_hours,remaining_hours,pending_entries,requirement_met')
      .eq('enrollment_id', enrollment.id),
    supabase
      .from('apprenticeship_rti_entries')
      .select('id,requirement_id,instruction_date,delivery_method,minutes_claimed,minutes_verified,status,evidence_notes,evidence_url,submitted_at:created_at,verified_at,rejection_reason')
      .eq('enrollment_id', enrollment.id)
      .order('instruction_date', { ascending: false })
      .limit(100),
  ]);

  const rows = progressRows || [];
  const verifiedHours = rows.reduce((sum: number, row: any) => sum + Number(row.verified_hours || 0), 0);
  const pendingCount = rows.reduce((sum: number, row: any) => sum + Number(row.pending_entries || 0), 0);
  const metCount = rows.filter((row: any) => row.requirement_met).length;
  const pct = Math.min(100, Math.round((verifiedHours / standard.relatedInstructionHours) * 100));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/apprentice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-red-700">USDOL Appendix A</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Verified Related Technical Instruction</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">Use this workspace for documented instruction that counts toward the approved {standard.relatedInstructionHours}-hour RTI requirement. Completing a video or lesson does not automatically create RTI credit; submitted instruction remains pending until sponsor staff or an authorized instructor verifies it.</p>
          </div>
          <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">Verified RTI</p>
            <p className="mt-1 text-2xl font-black">{verifiedHours.toFixed(2)} / {standard.relatedInstructionHours} hrs</p>
            <p className="mt-1 text-xs text-slate-300">{metCount}/{rows.length} categories satisfied · {pendingCount} pending</p>
          </div>
        </div>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${pct}%` }} /></div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row: any) => {
          const categoryPct = Math.min(100, Math.round((Number(row.verified_hours || 0) / Number(row.required_hours || 1)) * 100));
          return (
            <article key={row.requirement_id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <BookOpen className="h-5 w-5 text-brand-red-700" />
                {row.requirement_met ? <CheckCircle2 className="h-5 w-5 text-brand-green-700" /> : null}
              </div>
              <h2 className="mt-3 font-black leading-5 text-slate-950">{row.requirement_title}</h2>
              <p className="mt-2 text-sm font-bold text-slate-700">{Number(row.verified_hours || 0).toFixed(2)} / {row.required_hours} hours verified</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-red-600" style={{ width: `${categoryPct}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">{Number(row.remaining_hours || 0).toFixed(2)} hours remaining · {row.pending_entries || 0} pending</p>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3"><FileCheck2 className="mt-1 h-5 w-5 text-brand-red-700"/><div><h2 className="text-xl font-black text-slate-950">Submit RTI evidence</h2><p className="mt-1 text-sm text-slate-600">Enter actual instructional time. Do not enter work-shift/OJL time here.</p></div></div>
        <form action={submitRtiEvidence} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">Appendix A category
            <select name="requirementId" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-medium">
              <option value="">Select category</option>
              {rows.map((row: any) => <option key={row.requirement_id} value={row.requirement_id}>{row.requirement_title}</option>)}
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">Instruction date
            <input name="instructionDate" type="date" required max={new Date().toISOString().slice(0, 10)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
          </label>
          <label className="text-sm font-bold text-slate-700">Delivery method
            <select name="deliveryMethod" required className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-medium">
              <option value="lms">LMS / online instruction</option>
              <option value="classroom">Classroom</option>
              <option value="live_virtual">Live virtual class</option>
              <option value="lab">Instructor-led lab</option>
              <option value="external_approved">Approved external instruction</option>
            </select>
          </label>
          <label className="text-sm font-bold text-slate-700">Instruction minutes
            <input name="minutesClaimed" type="number" required min={1} max={720} step={1} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" placeholder="60" />
          </label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">Evidence link (optional)
            <input name="evidenceUrl" type="url" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" placeholder="https://..." />
          </label>
          <label className="text-sm font-bold text-slate-700 md:col-span-2">Instruction/evidence notes
            <textarea name="evidenceNotes" rows={4} className="mt-1 w-full rounded-xl border border-slate-300 p-3" placeholder="Instructor, topic, assignment, class session, or supporting evidence details." />
          </label>
          <div className="md:col-span-2"><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-red-700 px-5 py-2.5 font-black text-white hover:bg-brand-red-800"><ShieldCheck className="h-4 w-4" /> Submit for RTI verification</button></div>
        </form>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-xl font-black text-slate-950">RTI evidence history</h2></div>
        {!entries?.length ? <div className="px-6 py-10 text-center text-sm text-slate-500">No RTI evidence has been submitted yet.</div> : (
          <div className="divide-y divide-slate-200">
            {entries.map((entry: any) => {
              const requirement = rows.find((row: any) => row.requirement_id === entry.requirement_id);
              return <div key={entry.id} className="px-6 py-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black text-slate-950">{requirement?.requirement_title || 'RTI category'}</p><p className="mt-1 text-sm text-slate-600">{entry.instruction_date} · {String(entry.delivery_method).replace(/_/g, ' ')} · {entry.minutes_claimed} minutes claimed</p>{entry.evidence_notes ? <p className="mt-2 text-sm text-slate-700">{entry.evidence_notes}</p> : null}{entry.rejection_reason ? <p className="mt-2 text-sm font-semibold text-red-700">Rejected: {entry.rejection_reason}</p> : null}</div><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-slate-400"/><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${entry.status === 'verified' ? 'bg-emerald-100 text-emerald-800' : entry.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{entry.status}</span>{entry.status === 'verified' ? <span className="text-xs font-bold text-slate-700">{entry.minutes_verified} verified min</span> : null}</div></div></div>;
            })}
          </div>
        )}
      </section>
    </main>
  );
}
