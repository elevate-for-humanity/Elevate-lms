import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DollarSign, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeshipRuntimeContext } from '@/lib/apprenticeship/runtime-context';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Wage Compliance | Host Shop Portal', robots: { index: false, follow: false } };

async function verifyWage(formData: FormData) {
  'use server';
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const obligationId = String(formData.get('obligationId') || '').trim();
  const verifiedWage = Number(formData.get('verifiedWage'));
  const effectiveDate = String(formData.get('effectiveDate') || '').trim();
  const note = String(formData.get('note') || '').trim().slice(0, 2000);
  if (!obligationId || !Number.isFinite(verifiedWage) || verifiedWage <= 0 || !effectiveDate) redirect('/host-shop/dashboard/wages?error=required');

  const db = await requireAdminClient();
  const { data: obligation } = await db.from('apprenticeship_wage_obligations')
    .select('id,enrollment_id,placement_id,required_hourly_rate,status').eq('id', obligationId).maybeSingle();
  if (!obligation?.placement_id || !obligation.enrollment_id) redirect('/host-shop/dashboard/wages?error=placement');

  const allowedShopIds = new Set(board.shops.map((shop: any) => shop.id));
  const runtime = await resolveApprenticeshipRuntimeContext(db, { enrollmentId: obligation.enrollment_id });
  if (!runtime?.contract || runtime.placement?.id !== obligation.placement_id || !runtime.placement?.shop_id || !allowedShopIds.has(runtime.placement.shop_id)) {
    redirect('/host-shop/dashboard/wages?error=access');
  }

  const floor = Number(obligation.required_hourly_rate || 0);
  if (verifiedWage < floor) redirect('/host-shop/dashboard/wages?error=below-floor');

  const { error: wageUpdateError } = await db.from('apprentice_wage_updates').insert({
    placement_id: obligation.placement_id,
    effective_date: effectiveDate,
    hourly_wage: verifiedWage,
    note: note || `Verified against registered-program wage obligation ${obligationId}`,
    submitted_by_user_id: user.id,
  });
  if (wageUpdateError) throw new Error(`WAGE_UPDATE_INSERT_FAILED:${wageUpdateError.message}`);

  const { error: obligationError } = await db.from('apprenticeship_wage_obligations').update({
    status: 'verified', verified_wage: verifiedWage, verified_at: new Date().toISOString(), verified_by: user.id,
    effective_date: effectiveDate, evidence_notes: note || null,
  }).eq('id', obligationId);
  if (obligationError) throw new Error(`WAGE_OBLIGATION_VERIFY_FAILED:${obligationError.message}`);
  redirect('/host-shop/dashboard/wages?verified=1');
}

async function saveReportedPay(formData: FormData) {
  'use server';
  const {user}=await requireRole(HOST_SHOP_ROLES);
  const board=await getHostShopBoard(user.id);
  const placementId=String(formData.get('placementId')||'');
  const payType=String(formData.get('payType')||'');
  const base=Number(formData.get('base'));
  const commission=Number(formData.get('commission')||0);
  const date=String(formData.get('date')||'');
  if(!['hourly','hourly_plus_commission'].includes(payType) || !Number.isFinite(base) || base<=0 || !Number.isFinite(commission) || commission<0 || commission>100 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/host-shop/dashboard/wages?error=required');
  const placement=board.apprentices.find((item:any)=>item.id===placementId);
  if(!placement || !board.shops.some((shop:any)=>shop.id===placement.shop_id)) redirect('/host-shop/dashboard/wages?error=access');
  const db=await requireAdminClient();
  const {error}=await db.from('apprentice_wage_updates').insert({placement_id:placementId,effective_date:date,hourly_wage:base,submitted_by_user_id:user.id,note:payType==='hourly'?'Reported hourly wage; pending payroll and legal minimum verification.':'Reported hourly base with '+commission.toFixed(2)+'% additional commission; pending payroll and legal minimum verification.'});
  if(error) throw new Error('WAGE_REPORT_SAVE_FAILED');
  redirect('/host-shop/dashboard/wages?reported=1');
}

export default async function HostShopWagesPage({ searchParams }: { searchParams?: Promise<{ error?: string; verified?: string; reported?: string }> }) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const params = searchParams ? await searchParams : {};
  const db = await requireAdminClient();
  const placementIds = board.apprentices.map((a) => a.id).filter(Boolean);
  const apprenticeByPlacement = new Map(board.apprentices.map((a) => [a.id, a]));
  const { data: obligations, error } = placementIds.length
    ? await db.from('apprenticeship_wage_obligations')
        .select('id,enrollment_id,placement_id,standard_key,completed_competencies,appendix_hourly_rate,employer_registered_rate,legal_minimum_override,required_hourly_rate,triggered_at,effective_date,status,verified_wage,verified_at,evidence_notes')
        .in('placement_id', placementIds).order('triggered_at', { ascending: false })
    : { data: [], error: null };
  if (error) throw new Error(`WAGE_OBLIGATIONS_LOAD_FAILED:${error.message}`);

  const contractByPlacement = new Map<string, NonNullable<Awaited<ReturnType<typeof resolveApprenticeshipRuntimeContext>>>['contract']>();
  for (const apprentice of board.apprentices) {
    const enrollmentId = (obligations || []).find((row: any) => row.placement_id === apprentice.id)?.enrollment_id;
    if (!enrollmentId) continue;
    try {
      const runtime = await resolveApprenticeshipRuntimeContext(db, { enrollmentId });
      if (runtime?.contract && runtime.placement?.id === apprentice.id) contractByPlacement.set(apprentice.id, runtime.contract);
    } catch {
      // Unconfigured occupations remain blocked and are not presented as compliant.
    }
  }

  const missingContracts = board.apprentices.filter((apprentice: any) => !contractByPlacement.has(apprentice.id));
  const pending = (obligations || []).filter((row: any) => row.status === 'pending' || row.status === 'acknowledged');
  const verified = (obligations || []).filter((row: any) => row.status === 'verified');
  const registeredOccupations = Array.from(new Map(Array.from(contractByPlacement.values()).filter(Boolean).map((contract: any) => [contract.standard.rapidsCode, contract])).values()) as any[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Progressive Wage Compliance</h1><p className="mt-2 max-w-3xl text-slate-600">Each apprentice is evaluated against that apprentice&apos;s active registered occupation, employer-specific RAPIDS schedule, and applicable legal floor. No shop-wide wage assumption is used.</p></div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">Back to dashboard</Link>
      </div>

      {params?.reported ? <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 font-bold">Pay arrangement recorded for review; compliance not yet verified.</div> : null}
      {params?.verified ? <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 font-bold text-green-900">Wage verification recorded.</div> : null}
      {params?.error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-900">The wage verification could not be accepted. Confirm the apprentice placement, effective date, and required wage floor.</div> : null}

      <section className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-black">Report what you pay each apprentice</h2>
        <p className="mt-2 text-sm">Enter the guaranteed hourly base wage and any extra commission. This submission records employer-reported pay and does not verify legal compliance.</p>
        <form action={saveReportedPay} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">Apprentice<select name="placementId" required className="mt-1 block min-h-11 w-full rounded-lg border p-2"><option value="">Select apprentice</option>{board.apprentices.map((a:any)=><option key={a.id} value={a.id}>{a.name || 'Apprentice'}</option>)}</select></label>
          <label className="text-sm font-bold">Pay method<select name="payType" required className="mt-1 block min-h-11 w-full rounded-lg border p-2"><option value="hourly">Hourly base</option><option value="hourly_plus_commission">Hourly base + commission</option></select></label>
          <label className="text-sm font-bold">Guaranteed base per hour ($)<input name="base" required type="number" min="0.01" step="0.01" className="mt-1 block min-h-11 w-full rounded-lg border p-2"/></label>
          <label className="text-sm font-bold">Additional commission %<input name="commission" type="number" min="0" max="100" step="0.01" defaultValue="0" className="mt-1 block min-h-11 w-full rounded-lg border p-2"/></label>
          <label className="text-sm font-bold">Effective date<input name="date" required type="date" className="mt-1 block min-h-11 w-full rounded-lg border p-2"/></label>
          <button className="rounded-lg bg-blue-800 px-4 py-2 font-bold text-white">Record pay for review</button>
        </form>
      </section>
      <section className="mt-6 space-y-3">
        {registeredOccupations.length ? registeredOccupations.map((contract: any) => {
          const employerSchedule = contract.employer?.wageSchedule || null;
          return <div key={contract.standard.rapidsCode} className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 className="font-black">{contract.standard.occupationTitle} · RAPIDS {contract.standard.rapidsCode}</h2><p className="mt-1 text-sm font-semibold">Appendix baseline entry ${contract.standard.startingHourlyRate.toFixed(2)}/hr; competency milestones are resolved from the active registered standard.</p>{employerSchedule ? <p className="mt-1 text-sm font-semibold">Employer schedule: start ${Number(employerSchedule.startingHourlyRate || 0).toFixed(2)}/hr · end ${Number(employerSchedule.endingHourlyRate || 0).toFixed(2)}/hr · journeyworker ${Number(employerSchedule.journeyworkerHourlyRate || 0).toFixed(2)}/hr.</p> : <p className="mt-1 text-sm font-semibold">No employer-specific RAPIDS schedule is stored for this occupation; the registered baseline and applicable wage law remain controlling.</p>}</div></div></div>;
        }) : <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 font-semibold text-amber-950">The employer-specific registered wage schedule has not been verified for these placements. Review the apprentices listed below; contact Elevate sponsor administration to bind the correct occupation and wage schedule before recording wage compliance.</div>}
      </section>

      {missingContracts.length > 0 && <section className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><h2 className="text-lg font-black text-amber-950">Wage schedule review required</h2><p className="mt-1 text-sm text-amber-900">These active placements need their registered occupation, employer wage schedule, and applicable legal minimum verified. Zero pending milestones does not mean wages are compliant.</p><ul className="mt-3 space-y-2">{missingContracts.map((apprentice: any) => <li key={apprentice.id} className="rounded-lg border border-amber-200 bg-white p-3 text-sm font-semibold text-slate-900">{apprentice.name || 'Assigned apprentice'} — {apprentice.program_slug || 'Occupation not recorded'}: sponsor wage-schedule setup required before wage verification</li>)}</ul></section>}
      {registeredOccupations.map((contract: any) => <section key={'steps-'+contract.standard.rapidsCode} className="mt-4 rounded-xl border bg-white p-5"><h2 className="font-black">{contract.standard.occupationTitle} — progressive wage schedule</h2><p className="mt-2 text-sm">Registered baseline start: ${Number(contract.standard.startingHourlyRate).toFixed(2)}/hour, subject to employer agreement and applicable legal minimum.</p><ul className="mt-3 space-y-2 text-sm">{(contract.standard.wageMilestones || []).map((step: any, index: number) => <li key={index}>{step.completedCompetencies} approved competencies: registered baseline ${Number(step.hourlyRate).toFixed(2)}/hour (verify against employer-specific RAPIDS schedule)</li>)}</ul><p className="mt-3 text-xs text-slate-600">Do not treat this baseline as an approved employer payroll rate. A wage obligation and supporting payroll evidence are required for verification.</p></section>)}
      <section className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="text-lg font-black">Apprentice wages and commission</h2>
        <p className="mt-2 text-sm">Use the assigned apprentice's active wage obligation below to verify actual hourly pay. Record the employer's guaranteed base hourly rate and applicable effective date, with payroll evidence in the note. If commission is also paid, include the commission percentage and calculation in the payroll evidence note. Commission does not replace minimum-wage obligations. If the registered wage schedule is missing, request sponsor configuration before wage approval.</p>
        <p className="mt-2 text-sm font-bold">The minimum payable rate is the higher of the applicable federal, state, local, and binding apprenticeship or employer wage requirements. Do not assume a rate from a generic training page.</p>
      </section>
      <div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Pending wage actions" value={pending.length} /><Metric label="Verified wage actions" value={verified.length} /><Metric label="Registered occupations" value={registeredOccupations.length} /></div>

      <section className="mt-6 space-y-4"><h2 className="text-xl font-black text-slate-950">Actions requiring verification</h2>{pending.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No pending wage obligations have been generated. If an assigned apprentice is shown above under wage-schedule review, compliance remains unverified until the correct occupation and employer schedule are configured.</div> : pending.map((row: any) => {
        const apprentice = apprenticeByPlacement.get(row.placement_id); const contract: any = contractByPlacement.get(row.placement_id); const floor = Number(row.required_hourly_rate || 0);
        if (!contract) return <div key={row.id} className="rounded-2xl border border-red-200 bg-red-50 p-5 font-semibold text-red-900">{apprentice?.name || 'Assigned apprentice'} has a wage obligation but no active registered-program contract. Verification is blocked.</div>;
        return <form action={verifyWage} key={row.id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><input type="hidden" name="obligationId" value={row.id} /><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-lg font-black text-slate-950">{apprentice?.name || 'Assigned apprentice'}</p><p className="mt-1 text-sm font-semibold text-slate-700">{contract.standard.occupationTitle} · RAPIDS {contract.standard.rapidsCode} · {row.completed_competencies} competencies · required floor ${floor.toFixed(2)}/hr</p></div><DollarSign className="h-6 w-6 text-amber-700"/></div><div className="mt-4 grid gap-4 md:grid-cols-3"><label className="text-sm font-bold text-slate-800">Verified hourly wage<input name="verifiedWage" type="number" min={floor} step="0.01" required defaultValue={floor.toFixed(2)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="text-sm font-bold text-slate-800">Effective date<input name="effectiveDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3" /></label><label className="text-sm font-bold text-slate-800">Payroll/evidence note<input name="note" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3" placeholder="Payroll record, pay period, or note" /></label></div><button className="mt-4 rounded-xl bg-amber-700 px-4 py-2.5 font-black text-white">Verify wage implementation</button></form>;
      })}</section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-black text-slate-950">Verified wage history</h2></div><div className="divide-y divide-slate-100">{verified.length === 0 ? <p className="p-5 text-slate-600">No verified wage milestones yet.</p> : verified.map((row: any) => { const apprentice = apprenticeByPlacement.get(row.placement_id); const contract: any = contractByPlacement.get(row.placement_id); return <div key={row.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-black text-slate-950">{apprentice?.name || 'Assigned apprentice'}</p><p className="text-sm text-slate-600">{contract ? `${contract.standard.occupationTitle} · RAPIDS ${contract.standard.rapidsCode} · ` : ''}{row.completed_competencies} competencies · effective {row.effective_date || 'date not recorded'}</p></div><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-900">${Number(row.verified_wage || 0).toFixed(2)}/hr verified</span></div>{row.evidence_notes ? <p className="mt-2 text-sm text-slate-600">{row.evidence_notes}</p> : null}</div>; })}</div></section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-1 text-3xl font-black text-slate-950">{value}</p></article>; }
