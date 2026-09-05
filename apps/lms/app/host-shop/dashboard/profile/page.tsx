import Link from 'next/link';
import { Building2, CheckCircle2, FileText, MapPin, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import HostShopPublicMediaForm from './HostShopPublicMediaForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shop Profile | Host Shop Portal', description: 'View and manage the verified Host Shop profile stored in Elevate.', robots: { index: false, follow: false } };

export default async function HostShopProfilePage() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const isPlatformAdmin = effectiveRoles.some((role) => ['super_admin', 'admin', 'org_admin'].includes(role));
  const db = await requireAdminClient();
  const partnerId = board.partner?.id;
  const { data: publicProfile } = partnerId
    ? await db.from('partners').select('logo_url,flyer_url,video_url,public_slug,verification_status').eq('id', partnerId).maybeSingle()
    : { data: null };
  const publicProfileUrl = publicProfile?.verification_status === 'verified' && publicProfile?.public_slug
    ? `https://www.elevateforhumanity.org/host-shops/${publicProfile.public_slug}`
    : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Host Shop Profile</p><h1 className="mt-2 text-3xl font-black text-slate-950">{board.partner?.name || board.shops[0]?.name || 'Host Shop'}</h1><p className="mt-2 text-slate-600">Live partner, compliance, location, and public-profile information from Supabase.</p></div>
        <div className="flex flex-wrap gap-2">{!isPlatformAdmin ? <Link href="/host-shop/onboarding/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white">Update business profile</Link> : null}<Link href="/host-shop/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">Dashboard</Link></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 md:col-span-2"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-brand-blue-700"/><h2 className="font-black">Business record</h2></div><dl className="mt-5 grid gap-5 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase text-slate-500">Partner name</dt><dd className="mt-1 font-semibold">{board.partner?.name || 'Not provided'}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Program</dt><dd className="mt-1 font-semibold">{board.tradeInfo.label}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Approval</dt><dd className="mt-1 font-semibold capitalize">{board.partner?.approval_status || 'pending'}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Verification</dt><dd className="mt-1 font-semibold capitalize">{publicProfile?.verification_status || 'pending'}</dd></div></dl></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-green-700"/><h2 className="font-black">Compliance</h2></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span>MOU</span><b>{board.partner?.mou_signed ? 'Signed' : 'Pending'}</b></div><div className="flex justify-between"><span>Orientation</span><b>{board.partner?.onboarding_completed ? 'Complete' : 'Incomplete'}</b></div><div className="flex justify-between"><span>Documents</span><b>{board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount} accepted` : board.partner?.documents_verified ? 'Verified' : 'Pending'}</b></div></div><Link href="/host-shop/dashboard/documents" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-blue-700"><FileText className="h-4 w-4"/> Review documents</Link></section>
      </div>

      {!isPlatformAdmin ? <HostShopPublicMediaForm logoUrl={publicProfile?.logo_url} flyerUrl={publicProfile?.flyer_url} videoUrl={publicProfile?.video_url} publicProfileUrl={publicProfileUrl} /> : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-brand-blue-700"/><h2 className="font-black">Active shop locations</h2></div>{board.shops.length === 0 ? <p className="mt-4 text-sm text-slate-500">No active shop location is linked to this partner record.</p> : <div className="mt-4 grid gap-3 sm:grid-cols-2">{board.shops.map((shop) => <div key={shop.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-green-700"/><div><p className="font-black">{shop.name}</p><p className="mt-1 text-sm text-slate-600">{[shop.city, shop.state].filter(Boolean).join(', ') || 'Location details not provided'}</p></div></div></div>)}</div>}</section>
    </main>
  );
}
