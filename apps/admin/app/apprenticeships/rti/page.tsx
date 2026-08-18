import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Barber RTI Review | Apprenticeships | Admin',
  robots: { index: false, follow: false },
};

async function reviewRti(formData: FormData) {
  'use server';

  await requireRole(['admin', 'staff', 'instructor']);
  const entryId = String(formData.get('entryId') || '').trim();
  const decision = String(formData.get('decision') || '').trim();
  const notes = String(formData.get('notes') || '').trim().slice(0, 4000) || null;
  const minutesVerified = Number(formData.get('minutesVerified') || 0);

  if (!entryId || !['verified', 'rejected'].includes(decision)) {
    throw new Error('INVALID_RTI_REVIEW');
  }
  if (decision === 'verified' && (!Number.isFinite(minutesVerified) || minutesVerified <= 0)) {
    throw new Error('VERIFIED_MINUTES_REQUIRED');
  }
  if (decision === 'rejected' && (!notes || notes.length < 3)) {
    throw new Error('REJECTION_REASON_REQUIRED');
  }

  // Use the authenticated client so the SECURITY DEFINER function records the
  // actual sponsor/instructor auth.uid() instead of an anonymous service identity.
  const supabase = await createClient();
  const { error } = await supabase.rpc('verify_apprenticeship_rti_entry', {
    p_entry_id: entryId,
    p_minutes_verified: decision === 'verified' ? Math.round(minutesVerified) : 0,
    p_decision: decision,
    p_notes: notes,
  });
  if (error) throw new Error(`RTI_REVIEW_FAILED:${error.message}`);

  revalidatePath('/apprenticeships/rti');
}

export default async function BarberRtiReviewPage() {
  await requireRole(['admin', 'staff', 'instructor']);
  const db = await requireAdminClient();

  const [{ data: pending, error: pendingError }, { data: progress, error: progressError }] = await Promise.all([
    db
      .from('apprenticeship_rti_entries')
      .select('id,enrollment_id,user_id,requirement_id,instruction_date,delivery_method,minutes_claimed,evidence_url,evidence_notes,status,created_at,profiles:user_id(full_name,email),apprenticeship_rti_requirements:requirement_id(title,required_hours)')
      .eq('standard_key', 'barber-0030cb-2025-07-10')
      .eq('status', 'pending')
      .order('instruction_date', { ascending: true }),
    db
      .from('barber_appendix_a_completion_readiness')
      .select('enrollment_id,apprentice_user_id,completed_competencies,required_competencies,verified_rti_hours,required_rti_hours,rti_categories_met,has_supervised_placement,completion_ready'),
  ]);

  if (pendingError) throw new Error(`RTI_QUEUE_LOAD_FAILED:${pendingError.message}`);
  if (progressError) throw new Error(`RTI_PROGRESS_LOAD_FAILED:${progressError.message}`);

  const userIds = Array.from(new Set((progress || []).map((row: any) => row.apprentice_user_id).filter(Boolean)));
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] };
  const profileById = new Map((profiles || []).map((row: any) => [row.id, row]));

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6">
      <div>
        <Link href="/apprenticeships" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to apprenticeships
        </Link>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">USDOL Appendix A · Barber 0030CB</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">RTI Verification Queue</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Verify only documented instructional time. Do not convert video duration, work shifts, or unverified lesson completion into RTI credit.</p>
          </div>
          <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">{pending?.length || 0} pending</div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(progress || []).map((row: any) => {
          const profile: any = profileById.get(row.apprentice_user_id) || {};
          return (
            <article key={row.enrollment_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-black text-slate-950">{profile.full_name || profile.email || 'Apprentice'}</h2><p className="mt-1 text-xs text-slate-500">{profile.email || row.apprentice_user_id}</p></div>
                {row.completion_ready ? <CheckCircle2 className="h-5 w-5 text-emerald-700" /> : <ShieldCheck className="h-5 w-5 text-slate-400" />}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Competencies</p><p className="font-black text-slate-950">{row.completed_competencies}/{row.required_competencies}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Verified RTI</p><p className="font-black text-slate-950">{Number(row.verified_rti_hours || 0).toFixed(2)}/{row.required_rti_hours}h</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className={`rounded-full px-2.5 py-1 ${row.rti_categories_met ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{row.rti_categories_met ? 'RTI categories met' : 'RTI categories incomplete'}</span>
                <span className={`rounded-full px-2.5 py-1 ${row.has_supervised_placement ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{row.has_supervised_placement ? 'Supervisor assigned' : 'Supervisor/placement missing'}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4"><h2 className="text-xl font-black text-slate-950">Pending RTI evidence</h2></div>
        {!pending?.length ? (
          <div className="px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600"/><h3 className="mt-3 font-black text-slate-950">No RTI evidence awaiting review</h3></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {pending.map((entry: any) => {
              const apprentice = entry.profiles || {};
              const requirement = entry.apprenticeship_rti_requirements || {};
              return (
                <article key={entry.id} className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_360px]">
                  <div>
                    <h3 className="font-black text-slate-950">{apprentice.full_name || apprentice.email || 'Apprentice'}</h3>
                    <p className="mt-1 text-sm font-bold text-brand-blue-800">{requirement.title || 'Appendix A RTI category'}</p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-700">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {entry.minutes_claimed} minutes claimed</span>
                      <span>{entry.instruction_date}</span>
                      <span className="capitalize">{String(entry.delivery_method || '').replace(/_/g, ' ')}</span>
                    </div>
                    {entry.evidence_notes ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{entry.evidence_notes}</p> : null}
                    {entry.evidence_url ? <a href={entry.evidence_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-brand-blue-700 underline">Open submitted evidence</a> : null}
                  </div>
                  <div className="space-y-3">
                    <form action={reviewRti} className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input type="hidden" name="decision" value="verified" />
                      <label className="block text-xs font-black uppercase tracking-wide text-emerald-900">Minutes verified
                        <input name="minutesVerified" type="number" min={1} max={entry.minutes_claimed} defaultValue={entry.minutes_claimed} required className="mt-1 min-h-11 w-full rounded-xl border border-emerald-300 bg-white px-3 text-slate-950" />
                      </label>
                      <label className="block text-xs font-black uppercase tracking-wide text-emerald-900">Reviewer notes
                        <textarea name="notes" rows={2} className="mt-1 w-full rounded-xl border border-emerald-300 bg-white p-3 text-slate-950" placeholder="Evidence reviewed and verified." />
                      </label>
                      <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800"><CheckCircle2 className="h-4 w-4"/> Verify RTI</button>
                    </form>
                    <form action={reviewRti} className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-4">
                      <input type="hidden" name="entryId" value={entry.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <input type="hidden" name="minutesVerified" value="0" />
                      <label className="block text-xs font-black uppercase tracking-wide text-red-900">Rejection reason
                        <textarea name="notes" rows={2} required minLength={3} className="mt-1 w-full rounded-xl border border-red-300 bg-white p-3 text-slate-950" placeholder="Explain what evidence is missing or incorrect." />
                      </label>
                      <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-black text-red-800 hover:bg-red-100"><XCircle className="h-4 w-4"/> Reject RTI</button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
