import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, FileSignature } from 'lucide-react';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import { resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import {
  getHostShopMouMeta,
  getHostShopMouSections,
  type HostShopMouProgram,
} from '@/lib/partners/host-shop-mou-sections';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign Host Shop MOU | Elevate LMS', robots: { index: false, follow: false } };

function mouProgram(partner: Record<string, unknown>): HostShopMouProgram {
  const program = resolveHostShopProgram(partner);
  return program === 'nail_technician' ? 'nail' : program;
}

async function loadContext() {
  try {
    return await requireCurrentHostShopPartner();
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'HOST_SHOP_UNAUTHENTICATED') redirect('/host-shop/login?redirect=/host-shop/onboarding/mou');
    if (code === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED') redirect('/host-shop/dashboard');
    redirect('/unauthorized');
  }
}

async function signHostShopMou(formData: FormData) {
  'use server';
  const signerName = String(formData.get('signerName') ?? '').trim();
  const signerTitle = String(formData.get('signerTitle') ?? '').trim();
  const agreed = formData.get('agreed') === 'yes';
  if (!signerName || !agreed) redirect('/host-shop/onboarding/mou?error=signature_required');

  const { user, db, partner, isPlatformAdmin } = await requireCurrentHostShopPartner();
  if (isPlatformAdmin) redirect('/host-shop/onboarding/mou?error=admin_cannot_sign');
  if (partner.approval_status !== 'approved' || partner.status !== 'active') redirect('/host-shop/dashboard');
  if (partner.mou_signed) redirect('/host-shop/onboarding/profile');

  const program = mouProgram(partner as unknown as Record<string, unknown>);
  const meta = getHostShopMouMeta(program);
  const signedAt = new Date().toISOString();
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get('user-agent');
  const ipAddress = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() || requestHeaders.get('x-real-ip') || null;
  const authorityVersion = meta.registered && meta.rapidsId ? meta.rapidsId : `${program}-host-site-pathway`;
  const mouVersion = partner.mou_version || `${authorityVersion}-2026-08`;

  const { error: signatureError } = await db.from('mou_signatures').insert({
    user_id: user.id,
    signature_data: signerName,
    digital_signature: signerName,
    signer_name: signerName,
    signer_title: signerTitle || null,
    organization_name: partner.dba || partner.name,
    contact_name: signerName,
    contact_title: signerTitle || null,
    contact_email: user.email || partner.contact_email || null,
    agreed: true,
    agreed_at: signedAt,
    signed_at: signedAt,
    ip_address: ipAddress,
    user_agent: userAgent,
    partner_type: program,
    mou_version: mouVersion,
  });
  if (signatureError) throw new Error(`HOST_SHOP_MOU_SIGNATURE_FAILED:${signatureError.message}`);

  const { error: partnerUpdateError } = await db.from('partners').update({
    mou_signed: true,
    mou_signed_at: signedAt,
    mou_acknowledged: true,
    mou_version: mouVersion,
    onboarding_step: 'profile',
    updated_at: signedAt,
  }).eq('id', partner.id);
  if (partnerUpdateError) throw new Error(`HOST_SHOP_MOU_PARTNER_UPDATE_FAILED:${partnerUpdateError.message}`);
  redirect('/host-shop/onboarding/profile?mou=signed');
}

export default async function HostShopMouPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { partner, isPlatformAdmin } = await loadContext();
  const params = await searchParams;
  const program = mouProgram(partner as unknown as Record<string, unknown>);
  const meta = getHostShopMouMeta(program);
  const sections = getHostShopMouSections(program);

  if (partner.mou_signed) {
    return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-green-950"><CheckCircle2 className="h-10 w-10 text-green-700" /><h1 className="mt-4 text-3xl font-black">MOU already signed</h1><p className="mt-2">{partner.dba || partner.name} has a signed Host Shop MOU on file.</p><Link href="/host-shop/onboarding/profile" className="mt-6 inline-flex rounded-xl bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-800">Continue onboarding</Link></div></main>;
  }

  return (
    <main className="bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4"><FileSignature className="mt-1 h-9 w-9 shrink-0 text-blue-700" /><div><p className="text-sm font-extrabold uppercase tracking-wide text-blue-700">{meta.documentType}</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">{meta.title}</h1><p className="mt-2 text-lg font-semibold text-slate-700">{meta.subtitle}</p><p className="mt-3 text-sm text-slate-600">Worksite: <strong>{partner.dba || partner.name}</strong> · {meta.registrationLabel}</p></div></div>
        </div>

        {!meta.registered ? <div className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0"/><div><p className="font-black">Host-site pathway only</p><p className="mt-1 text-sm font-semibold">This MOU does not represent this track as a federally registered occupation because the canonical registered-program registry does not contain an approved standard for it.</p></div></div> : null}
        {params.error === 'signature_required' ? <div role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 font-bold text-red-950">Enter the authorized signer name and accept the agreement before signing.</div> : null}
        {params.error === 'admin_cannot_sign' ? <div role="alert" className="mt-5 rounded-xl border border-blue-300 bg-blue-50 p-4 font-bold text-blue-950">Admin preview is read-only for legal signatures. The Host Shop must sign its own MOU.</div> : null}

        <div className="mt-6 space-y-4">{sections.map((section) => <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7"><h2 className="text-xl font-black">{section.title}</h2><div className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-800">{section.content}</div></section>)}</div>

        {isPlatformAdmin ? (
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6"><p className="font-black text-blue-950">Admin preview</p><p className="mt-2 text-sm leading-6 text-blue-900">You can inspect this Host Shop’s MOU, but only an authorized Host Shop signer can execute it.</p><Link href="/host-shop/dashboard" className="mt-4 inline-flex rounded-xl border border-blue-300 bg-white px-5 py-3 font-bold text-blue-950 hover:bg-blue-100">Return to Host Shop dashboard</Link></div>
        ) : (
          <form action={signHostShopMou} className="mt-6 rounded-2xl border border-slate-300 bg-white p-6 sm:p-8">
            <h2 className="text-2xl font-black">Authorized electronic signature</h2><p className="mt-2 text-sm leading-6 text-slate-700">Typing your legal name below and submitting this form constitutes your electronic signature for this MOU.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="font-bold">Authorized signer name *<input name="signerName" required autoComplete="name" className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label><label className="font-bold">Title<input name="signerTitle" autoComplete="organization-title" className="mt-2 w-full rounded-xl border border-slate-400 px-4 py-3 font-medium outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" /></label></div>
            <label className="mt-5 flex items-start gap-3 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm font-semibold leading-6"><input name="agreed" value="yes" type="checkbox" required className="mt-1 h-5 w-5 shrink-0" /><span>I am authorized to sign for {partner.dba || partner.name}. I have read the complete MOU and agree to its terms and the governing program records identified above.</span></label>
            <button type="submit" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 font-black text-white hover:bg-blue-800">Sign MOU and continue</button>
          </form>
        )}
      </div>
    </main>
  );
}
