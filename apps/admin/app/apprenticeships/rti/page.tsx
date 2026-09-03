import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, ShieldCheck, XCircle } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Registered Apprenticeship RTI Review | Admin',
  robots: { index: false, follow: false },
};

async function reviewRti(formData: FormData) {
  'use server';

  await requireRole(['admin', 'super_admin', 'org_admin', 'staff', 'instructor']);
  const entryId = String(formData.get('entryId') || '').trim();
  const decision = String(formData.get('decision') || '').trim();
  const notes = String(formData.get('notes') || '').trim().slice(0, 4000) || null;
  const minutesVerified = Number(formData.get('minutesVerified') || 0);

  if (!entryId || !['verified', 'rejected'].includes(decision)) throw new Error('INVALID_RTI_REVIEW');
  if (decision === 'verified' && (!Number.isFinite(minutesVerified) || minutesVerified <= 0)) {
    throw new Error('VERIFIED_MINUTES_REQUIRED');
  }
  if (decision === 'rejected' && (!notes || notes.length < 3)) throw new Error('REJECTION_REASON_REQUIRED');

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

export default async function RegisteredRtiReviewPage() {
  const { user, effectiveRoles } = await requireRole(['admin', 'super_admin', 'org_admin', 'staff', 'instructor']);
  const db = await requireAdminClient();
  const hasSponsorWideRole = effectiveRoles.some((role) => ['admin', 'super_admin', 'staff'].includes(role));
  const instructorOnly = effectiveRoles.includes('instructor') && !hasSponsorWideRole && !effectiveRoles.includes('org_admin');
  const orgAdminOnly = effectiveRoles.includes('org_admin') && !hasSponsorWideRole;

  const { data: activeStandards, error: standardsError } = await db
    .from('apprenticeship_standard_versions')
    .select('standard_key,program_slug,occupation_title,rapids_code,registration_number,competency_count,related_instruction_hours,is_active')
    .eq('is_active', true)
    .order('occupation_title');
  if (standardsError) throw new Error(`REGISTERED_STANDARD_LOAD_FAILED:${standardsError.message}`);

  const supportedStandards = (activeStandards || []).filter((row: any) => Boolean(getRegisteredProgramStandard(row.program_slug)));
  const standardKeys = supportedStandards.map((row: any) => row.standard_key);
  const standardByKey = new Map(supportedStandards.map((row: any) => [row.standard_key, row]));

  let allowedEnrollmentIds: string[] | null = null;
  if (instructorOnly) {
    const { data: assignments, error: assignmentError } = await db
      .from('program_instructors')
      .select('program_id')
      .eq('instructor_id', user.id);
    if (assignmentError) throw new Error(`INSTRUCTOR_ASSIGNMENTS_LOAD_FAILED:${assignmentError.message}`);
    const programIds = (assignments || []).map((row: any) => row.program_id).filter(Boolean);
    if (!programIds.length) allowedEnrollmentIds = [];
    else {
      const { data: enrollments, error: enrollmentError } = await db
        .from('program_enrollments')
        .select('id')
        .in('program_id', programIds);
      if (enrollmentError) throw new Error(`INSTRUCTOR_ENROLLMENTS_LOAD_FAILED:${enrollmentError.message}`);
      allowedEnrollmentIds = (enrollments || []).map((row: any) => row.id);
    }
  } else if (orgAdminOnly) {
    const { data: memberships, error: membershipError } = await db
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['org_owner', 'org_admin']);
    if (membershipError) throw new Error(`ORG_ADMIN_MEMBERSHIP_LOAD_FAILED:${membershipError.message}`);
    const organizationIds = (memberships || []).map((row: any) => row.organization_id).filter(Boolean);
    if (!organizationIds.length) allowedEnrollmentIds = [];
    else {
      const { data: enrollments, error: enrollmentError } = await db
        .from('program_enrollments')
        .select('id')
        .in('organization_id', organizationIds);
      if (enrollmentError) throw new Error(`ORG_ADMIN_ENROLLMENTS_LOAD_FAILED:${enrollmentError.message}`);
      allowedEnrollmentIds = (enrollments || []).map((row: any) => row.id);
    }
  }

  let pendingQuery = db
    .from('apprenticeship_rti_entries')
    .select('id,enrollment_id,user_id,standard_key,requirement_id,instruction_date,delivery_method,minutes_claimed,evidence_url,evidence_notes,status,created_at,profiles:user_id(full_name,email),apprenticeship_rti_requirements:requirement_id(title,required_hours)')
    .in('standard_key', standardKeys.length ? standardKeys : ['__none__'])
    .eq('status', 'pending')
    .order('instruction_date', { ascending: true });
  if (allowedEnrollmentIds !== null) {
    pendingQuery = pendingQuery.in('enrollment_id', allowedEnrollmentIds.length ? allowedEnrollmentIds : ['00000000-0000-0000-0000-000000000000']);
  }
  const { data: pending, error: pendingError } = await pendingQuery;
  if (pendingError) throw new Error(`RTI_QUEUE_LOAD_FAILED:${pendingError.message}`);

  const pendingByStandard = new Map<string, number>();
  for (const entry of pending || []) pendingByStandard.set(entry.standard_key, (pendingByStandard.get(entry.standard_key) || 0) + 1);

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6">
      <div>
        <Link href="/apprenticeships" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" /> Back to apprenticeships
        </Link>
        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Registered Apprenticeship · Verified RTI</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">RTI Verification Queue</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">Verify documented instructional time against the apprentice&apos;s active registered occupation. Video duration, work shifts, and unverified lesson completion never become RTI credit automatically.</p>
          </div>
          <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-900">{pending?.length || 0} pending</div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {supportedStandards.map((row: any) => {
          const contract = getRegisteredProgramStandard(row.program_slug)!;
          return (
            <article key={row.standard_key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-950">{contract.standard.occupationTitle}</h2>
                  <p className="mt-1 text-xs font-bold text-slate-500">RAPIDS {contract.standard.rapidsCode} · {contract.sponsor.registrationNumber}</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-brand-blue-700" />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <Metric label="Competencies" value={String(contract.completion.competencyCount)} />
                <Metric label="RTI hours" value={String(contract.completion.requiredRtiHours)} />
                <Metric label="Pending" value={String(pendingByStandard.get(row.standard_key) || 0)} />
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
              const standard: any = standardByKey.get(entry.standard_key) || {};
              return (
                <article key={entry.id} className="grid gap-5 px-6 py-5 lg:grid-cols-[1fr_360px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-black text-slate-950">{apprentice.full_name || apprentice.email || 'Apprentice'}</h3><span className="rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-black text-cyan-900">{standard.occupation_title || 'Registered occupation'} · {standard.rapids_code || ''}</span></div>
                    <p className="mt-1 text-sm font-bold text-brand-blue-800">{requirement.title || 'Registered RTI category'}</p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-black text-slate-950">{value}</p></div>;
}
