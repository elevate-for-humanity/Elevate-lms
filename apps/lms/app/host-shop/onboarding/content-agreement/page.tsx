import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';
import {
  HOST_SHOP_CONTENT_AGREEMENT_VERSION as VERSION,
  HOST_SHOP_CONTENT_AGREEMENT_TITLE as TITLE,
  HOST_SHOP_CONTENT_AGREEMENT_SECTIONS as SECTIONS,
  HOST_SHOP_CONTENT_AGREEMENT_TEXT as TEXT,
} from '@/lib/partners/host-shop-content-agreement';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Content Protection Agreement',
  robots: { index: false, follow: false },
};
const path = '/host-shop/onboarding/content-agreement';
const hash = () =>
  createHash('sha256')
    .update(VERSION + '\n' + TEXT)
    .digest('hex');
async function sign(form: FormData) {
  'use server';
  const ctx = await requireCurrentHostShopPartner({ allowPendingOnboarding: true });
  if (ctx.isPlatformAdmin) redirect(path + '?error=owner_required');
  const name = String(form.get('signerName') || '').trim();
  const title = String(form.get('signerTitle') || '').trim();
  if (
    name.length < 2 ||
    name.length > 160 ||
    !title ||
    title.length > 120 ||
    form.get('authority') !== 'yes' ||
    form.get('agreed') !== 'yes' ||
    form.get('version') !== VERSION
  )
    redirect(path + '?error=signature_required');
  const { data: member, error: memberError } = await ctx.db
    .from('partner_users')
    .select('role')
    .eq('partner_id', ctx.partner.id)
    .eq('user_id', ctx.user.id)
    .eq('status', 'active')
    .in('role', ['owner', 'partner_admin', 'admin'])
    .maybeSingle();
  if (memberError || !member) redirect(path + '?error=owner_required');
  const h = await headers();
  const { error } = await ctx.db.from('host_shop_content_agreements').insert({
    partner_id: ctx.partner.id,
    signed_by: ctx.user.id,
    version: VERSION,
    content_sha256: hash(),
    signer_name: name,
    signer_title: title,
    signer_email: ctx.user.email || ctx.partner.contact_email || '',
    ip_address: h.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: h.get('user-agent'),
    agreement_text: TEXT,
  });
  if (error && error.code !== '23505') throw new Error('HOST_SHOP_CONTENT_AGREEMENT_SAVE_FAILED');
  redirect(path + '?signed=1');
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireCurrentHostShopPartner({ allowPendingOnboarding: true });
  const params = await searchParams;
  const { data: receipt, error } = await ctx.db
    .from('host_shop_content_agreements')
    .select('signer_name,signer_title,signed_at,content_sha256,agreement_text')
    .eq('partner_id', ctx.partner.id)
    .eq('version', VERSION)
    .maybeSingle();
  if (error) throw new Error('HOST_SHOP_CONTENT_AGREEMENT_LOAD_FAILED');
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-900">
      <Link href="/host-shop/dashboard/resources" className="font-bold underline">
        Back to guides and agreements
      </Link>
      <header>
        <p className="text-sm font-bold">
          {ctx.partner.name} · Version {VERSION}
        </p>
        <h1 className="mt-2 text-3xl font-black">{TITLE}</h1>
        <p className="mt-3">
          Read every section. The shop’s authorized signer must sign using their own account.
        </p>
      </header>
      {params.error && (
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          {params.error === 'owner_required'
            ? 'An authorized shop owner or partner administrator must sign. Administrative previews cannot sign for a shop.'
            : 'Enter your name and title, confirm your authority, and acknowledge the agreement.'}
        </p>
      )}
      {receipt ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-bold">Terms you signed</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7">{receipt.agreement_text}</p>
        </section>
      ) : (
        SECTIONS.map(([title, text]) => (
          <section key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 leading-7">{text}</p>
          </section>
        ))
      )}
      {receipt ? (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <h2 className="text-xl font-bold">Signed agreement on file</h2>
          <p>
            {receipt.signer_name}, {receipt.signer_title} ·{' '}
            {new Date(receipt.signed_at).toLocaleDateString('en-US', {
              timeZone: 'America/New_York',
            })}
          </p>
          <p className="mt-2 break-all text-xs">Document fingerprint: {receipt.content_sha256}</p>
          <p className="mt-2">
            Use your browser’s Print command to keep a copy of these terms and this receipt.
          </p>
        </section>
      ) : ctx.isPlatformAdmin ? (
        <p className="rounded-xl bg-amber-50 p-5">
          Awaiting the shop’s authorized signer. This preview cannot sign or accept terms for the
          shop.
        </p>
      ) : (
        <form action={sign} className="space-y-4 rounded-2xl border border-slate-300 bg-white p-6">
          <input type="hidden" name="version" value={VERSION} />
          <label className="block font-bold">
            Full legal name
            <input
              name="signerName"
              required
              minLength={2}
              maxLength={160}
              className="mt-2 block min-h-12 w-full rounded-lg border p-3"
            />
          </label>
          <label className="block font-bold">
            Title at this shop
            <input
              name="signerTitle"
              required
              maxLength={120}
              className="mt-2 block min-h-12 w-full rounded-lg border p-3"
            />
          </label>
          <label className="flex gap-3">
            <input type="checkbox" name="authority" value="yes" required className="mt-1 h-5 w-5" />
            I am authorized to sign for {ctx.partner.name}.
          </label>
          <label className="flex gap-3">
            <input type="checkbox" name="agreed" value="yes" required className="mt-1 h-5 w-5" />I
            read and agree to every section above. Typing my name and submitting creates my
            electronic signature.
          </label>
          <button className="min-h-12 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">
            Sign content-protection agreement
          </button>
        </form>
      )}
    </main>
  );
}
