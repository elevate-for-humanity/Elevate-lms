import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  BARBER_APPRENTICE_APPLICATION_URL,
  HOST_SHOP_APPRENTICESHIP_ORIENTATION,
  HOST_SHOP_ORIENTATION_VERSION,
} from '@/lib/course-builder/templates/host-shop-apprenticeship-orientation';

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
    policies_acknowledged: [...REQUIRED_POLICIES, `orientation-version:${HOST_SHOP_ORIENTATION_VERSION}`],
    acknowledged_at: new Date().toISOString(),
    ip_address: ip,
    user_agent: userAgent,
  });
  if (acknowledgmentError) throw new Error(`HOST_SHOP_ACKNOWLEDGMENT_FAILED:${acknowledgmentError.message}`);

  const { error: partnerError } = await db.from('partners').update({
    onboarding_completed: true,
    onboarding_step: `orientation_complete:${HOST_SHOP_ORIENTATION_VERSION}`,
    updated_at: new Date().toISOString(),
  }).eq('id', board.partner.id);
  if (partnerError) throw new Error(`HOST_SHOP_ONBOARDING_UPDATE_FAILED:${partnerError.message}`);

  redirect('/host-shop/dashboard/board');
}

export default async function HostShopOrientationPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const params = searchParams ? await searchParams : {};
  const canSign = Boolean(board.partner?.mou_signed) && board.missingDocuments.length === 0 && board.pendingDocuments.length === 0;

  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Required Host Shop Training · Version {HOST_SHOP_ORIENTATION_VERSION}</p>
    <h1 className="mt-2 text-3xl font-black text-slate-950">{HOST_SHOP_APPRENTICESHIP_ORIENTATION.title}</h1>
    <p className="mt-3 max-w-3xl text-slate-700">{board.partner?.name || 'Your shop'} must complete the canonical Course Builder orientation and electronic acknowledgment before operational dashboard access unlocks.</p>

    {params?.error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-900">Complete the MOU and required documents, accept every acknowledgment, and sign with the exact account name before continuing.</div> : null}

    <section className="mt-6 rounded-2xl border border-brand-blue-200 bg-brand-blue-50 p-5">
      <h2 className="font-black text-slate-950">Recruit an apprentice</h2>
      <p className="mt-1 text-sm text-slate-700">Send prospective barber apprentices the canonical application. Elevate handles application, eligibility, enrollment, and placement.</p>
      <a href={BARBER_APPRENTICE_APPLICATION_URL} className="mt-3 inline-flex rounded-xl bg-brand-blue-700 px-4 py-2 font-black text-white">Open apprentice application</a>
    </section>

    <div className="mt-6 space-y-5">
      {HOST_SHOP_APPRENTICESHIP_ORIENTATION.modules.map((courseModule) => (
        <section key={courseModule.slug} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="text-xl font-black text-slate-950">{courseModule.title}</h2>
          <div className="mt-4 space-y-5">
            {courseModule.lessons.map((courseLesson) => (
              <article key={courseLesson.slug}>
                <h3 className="font-black text-slate-900">{courseLesson.title}</h3>
                <div className="prose prose-slate mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: courseLesson.renderedHtml || courseLesson.content || '' }} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>

    <form action={completeOrientation} className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-amber-800"/><div className="w-full">
        <h2 className="font-black text-amber-950">Required acknowledgment and electronic signature</h2>
        <div className="mt-4 space-y-3 text-sm font-semibold text-amber-950">
          <label className="flex gap-2"><input required type="checkbox" name="paid-worker" /> I understand apprentices are paid workers and compensation must follow the registered wage schedule and applicable law.</label>
          <label className="flex gap-2"><input required type="checkbox" name="no-revenue-guarantee" /> I understand apprenticeship participation does not guarantee shop revenue or profit.</label>
          <label className="flex gap-2"><input required type="checkbox" name="truthful-ojl" /> I will approve only OJL hours and competencies that are accurate and supported.</label>
          <label className="flex gap-2"><input required type="checkbox" name="geofence-integrity" /> I will not falsify or bypass geofence, timeclock, attendance, or location records.</label>
          <label className="flex gap-2"><input required type="checkbox" name="progressive-wages" /> I understand progressive wage and payroll documentation requirements.</label>
          <label className="flex gap-2"><input required type="checkbox" name="transfer-credit-sponsor-approval" /> I understand the shop cannot promise or award transfer credit; sponsor/state review controls credit.</label>
        </div>
        <label className="mt-5 block text-sm font-black text-amber-950">Electronic signature — type your account name exactly<input name="signerName" required className="mt-2 min-h-11 w-full rounded-xl border border-amber-400 bg-white px-3 text-slate-950" /></label>
        <button type="submit" disabled={!canSign} className="mt-5 min-h-12 rounded-xl bg-amber-800 px-5 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-50">Acknowledge and unlock Host Shop dashboard</button>
        {!canSign ? <p className="mt-3 text-sm font-bold text-amber-950">The MOU and all required Host Shop documents must be complete before final sign-off.</p> : null}
      </div></div>
    </form>

    {board.partner?.onboarding_completed ? <div className="mt-6"><Link href="/host-shop/dashboard/board" className="inline-flex rounded-xl bg-brand-green-700 px-4 py-2 font-black text-white">Return to Host Shop dashboard</Link></div> : null}
  </main>;
}
