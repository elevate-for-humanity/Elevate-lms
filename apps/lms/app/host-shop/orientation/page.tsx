import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CheckCircle2, DollarSign, MapPin, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Required Orientation | Host Shop Portal', robots: { index: false, follow: false } };

const REQUIRED_POLICIES = [
  'paid-worker',
  'no-revenue-guarantee',
  'truthful-ojl',
  'geofence-integrity',
  'progressive-wages',
  'transfer-credit-sponsor-approval',
] as const;

const modules = [
  ['1. Registered Apprenticeship Basics', 'Understand the sponsor-of-record structure, the Host Shop role, required supervision, and the difference between RTI and paid on-the-job learning.'],
  ['2. Sponsor vs. Host Shop Responsibilities', 'Elevate/2Exclusive administers the registered program. The Host Shop provides approved supervision, a safe workplace, accurate records, wage compliance, competency verification, and required documentation.'],
  ['3. How the Host Shop Makes Money', 'Apprentices can increase legitimate supervised service capacity, customer retention, retail sales, and workforce development value. Revenue is never guaranteed. Apprentice wages, payroll taxes, supplies, insurance, supervision, rent, processing fees, and other overhead remain shop expenses.'],
  ['4. Recruit and Sign Up an Apprentice', 'Send prospective apprentices the canonical Barber Apprenticeship application. Do not create a separate enrollment or promise acceptance. Elevate completes eligibility, enrollment, and program placement.'],
  ['5. Employment, W-2, Commission & Progressive Wages', 'The apprentice is a paid worker. Document the employment/pay structure and follow the registered progressive wage schedule and applicable law. Commission is a compensation method; it does not by itself determine worker classification.'],
  ['6. Payroll and Proof of Pay', 'Maintain payroll records showing the apprentice was paid for employment. Payroll evidence may be used to reconcile approved OJL hours. QuickBooks/payroll setup may be offered separately; core apprenticeship compliance tools remain included.'],
  ['7. 2,000 OJL / 144 RTI Structure', 'Coordinate hands-on training with the Prestige Elevation Barber Curriculum. RTI is the related instruction curriculum; OJL is supervised paid work and competency development at the approved shop.'],
  ['8. Hands-On Teaching', 'Use the Host Shop syllabus to sequence sanitation, consultation, tools, haircutting, shaving/beard services, chemical services, professionalism/business skills, and state-board preparation alongside the apprentice RTI modules.'],
  ['9. Geofenced Timeclock', 'Apprentices must clock in/out using the platform at the approved shop. GPS coordinates are required and the server validates the approved site geofence. Never approve falsified, off-site, duplicate, or otherwise unsupported time.'],
  ['10. Monitor Apprentice Progress', 'Use the Host Shop Board to review active apprentices, OJL totals, attendance, RTI/progress indicators, competencies, documents, and items requiring action.'],
  ['11. Approve Hours & Competencies', 'Review pending OJL entries and approve only hours actually worked at the assigned shop. Reject inaccurate entries with a reason. Supervisor competency sign-off means the apprentice demonstrated the skill to the required standard.'],
  ['12. Transfer Hours', 'Do not promise a transfer-hour amount. Transfer credit is subject to documented prior training/work, sponsor review, and the rules of the state or jurisdiction governing the apprenticeship. Elevate must approve transfer credit before it changes the apprentice record.'],
  ['13. Documentation & Compliance', 'Keep licenses, insurance, MOU/host-site documents, payroll evidence, attendance, hours, competencies, corrective documentation, and other required records current.'],
  ['14. Final Host Shop Acknowledgment', 'The authorized shop representative must complete the acknowledgment below before Host Shop onboarding is considered complete.'],
] as const;

async function completeOrientation(formData: FormData) {
  'use server';
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  if (!board.partner?.id) throw new Error('HOST_SHOP_PARTNER_REQUIRED');
  if (!board.partner.mou_signed || board.missingDocuments.length > 0 || board.pendingDocuments.length > 0) {
    redirect('/host-shop/orientation?error=onboarding_requirements');
  }

  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('full_name').eq('id', user.id).maybeSingle();
  const signerName = String(formData.get('signerName') || '').trim();
  if (!profile?.full_name || signerName.toLowerCase() !== profile.full_name.trim().toLowerCase()) {
    redirect('/host-shop/orientation?error=signature');
  }

  for (const policy of REQUIRED_POLICIES) {
    if (formData.get(policy) !== 'on') redirect('/host-shop/orientation?error=acknowledgment');
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || 'unknown';
  const userAgent = requestHeaders.get('user-agent') || 'unknown';

  const { error: acknowledgmentError } = await db.from('partner_policy_acknowledgments').insert({
    shop_name: board.partner.name || board.shops[0]?.name || 'Host Shop',
    signer_name: signerName,
    policies_acknowledged: [...REQUIRED_POLICIES],
    acknowledged_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
  });
  if (acknowledgmentError) throw new Error(`HOST_SHOP_ACKNOWLEDGMENT_FAILED:${acknowledgmentError.message}`);

  const { error: partnerError } = await db.from('partners').update({
    onboarding_completed: true,
    onboarding_step: 'orientation_complete',
    updated_at: new Date().toISOString(),
  }).eq('id', board.partner.id);
  if (partnerError) throw new Error(`HOST_SHOP_ONBOARDING_UPDATE_FAILED:${partnerError.message}`);

  redirect('/host-shop/dashboard/board');
}

export default async function HostShopOrientationPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const params = searchParams ? await searchParams : {};
  const applicationUrl = '/apply/student?program=barber-apprenticeship';

  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Required Host Shop Training</p>
    <h1 className="mt-2 text-3xl font-black text-slate-950">Host Shop Apprenticeship Orientation</h1>
    <p className="mt-3 max-w-3xl text-slate-700">{board.partner?.name || 'Your shop'} must complete this operating orientation before the Host Shop dashboard unlocks.</p>

    {params?.error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">Complete the MOU and required documents, accept every acknowledgment, and sign with the exact account name before continuing.</div> : null}

    <div className="mt-6 grid gap-3 sm:grid-cols-4">
      <div className="rounded-2xl border bg-white p-4"><Users className="h-5 w-5"/><p className="mt-2 font-black">Recruit</p><p className="text-sm text-slate-600">Send the approved application.</p></div>
      <div className="rounded-2xl border bg-white p-4"><MapPin className="h-5 w-5"/><p className="mt-2 font-black">Verify</p><p className="text-sm text-slate-600">Geofenced OJL time.</p></div>
      <div className="rounded-2xl border bg-white p-4"><CheckCircle2 className="h-5 w-5"/><p className="mt-2 font-black">Approve</p><p className="text-sm text-slate-600">Hours and competencies.</p></div>
      <div className="rounded-2xl border bg-white p-4"><DollarSign className="h-5 w-5"/><p className="mt-2 font-black">Pay</p><p className="text-sm text-slate-600">Document wages/payroll.</p></div>
    </div>

    <section className="mt-6 rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-5"><h2 className="font-black text-slate-950">Recruit an apprentice</h2><p className="mt-1 text-sm text-slate-700">Send prospective barber apprentices the canonical application. Elevate handles the application, eligibility, enrollment, and placement record.</p><Link href={applicationUrl} className="mt-3 inline-flex rounded-xl bg-brand-blue-700 px-4 py-2 font-black text-white">Open apprentice application</Link></section>

    <div className="mt-6 space-y-4">{modules.map(([title, body]) => <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black text-slate-950">{title}</h2><p className="mt-2 leading-7 text-slate-700">{body}</p></section>)}</div>

    <form action={completeOrientation} className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-800"/><div className="w-full"><h2 className="font-black text-amber-950">Required acknowledgment and signature</h2><div className="mt-4 space-y-3 text-sm font-semibold text-amber-950">
        <label className="flex gap-2"><input required type="checkbox" name="paid-worker" /> I understand apprentices are paid workers and must be paid under the registered wage schedule and applicable law.</label>
        <label className="flex gap-2"><input required type="checkbox" name="no-revenue-guarantee" /> I understand apprentice participation does not guarantee shop revenue or profit.</label>
        <label className="flex gap-2"><input required type="checkbox" name="truthful-ojl" /> I will approve only OJL hours and competencies that are accurate and supported.</label>
        <label className="flex gap-2"><input required type="checkbox" name="geofence-integrity" /> I will not falsify or bypass geofence, timeclock, attendance, or location records.</label>
        <label className="flex gap-2"><input required type="checkbox" name="progressive-wages" /> I understand compensation and progressive wage requirements must be documented.</label>
        <label className="flex gap-2"><input required type="checkbox" name="transfer-credit-sponsor-approval" /> I understand transfer credit is not promised by the shop and requires sponsor/state review.</label>
      </div><label className="mt-5 block text-sm font-black text-amber-950">Electronic signature — type your account name exactly<input name="signerName" required className="mt-2 min-h-11 w-full rounded-xl border border-amber-400 bg-white px-3 text-slate-950" /></label>
      <button type="submit" disabled={!board.partner?.mou_signed || board.missingDocuments.length > 0 || board.pendingDocuments.length > 0} className="mt-5 min-h-12 rounded-xl bg-amber-800 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Acknowledge and unlock Host Shop dashboard</button>
      {(!board.partner?.mou_signed || board.missingDocuments.length > 0 || board.pendingDocuments.length > 0) ? <p className="mt-3 text-sm font-bold text-amber-950">The MOU and all required Host Shop documents must be complete before final sign-off.</p> : null}</div></div>
    </form>
  </main>;
}
