import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Clock, FileText, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import {
  getHostShopAdminPartnerOptions,
  getHostShopBoard,
  HOST_SHOP_ADMIN_COOKIE,
} from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function selectAdminPartner(formData: FormData) {
  'use server';

  await requireRole(['super_admin', 'admin', 'org_admin']);
  const partnerId = String(formData.get('partnerId') ?? '').trim();
  if (!partnerId) redirect('/host-shop/dashboard/board');

  const db = await requireAdminClient();
  const { data: partner } = await db
    .from('partners')
    .select('id, status, approval_status, is_active, partner_type, program_type, programs')
    .eq('id', partnerId)
    .maybeSingle();

  const typeText = [
    partner?.partner_type,
    partner?.program_type,
    ...(Array.isArray(partner?.programs) ? partner.programs : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const eligible =
    partner &&
    partner.status === 'active' &&
    partner.approval_status === 'approved' &&
    partner.is_active !== false &&
    /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);

  if (!eligible) redirect('/host-shop/dashboard/board?error=inactive_partner');

  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, partnerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60,
  });
  redirect('/host-shop/dashboard/board');
}

async function clearAdminPartner() {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  redirect('/host-shop/dashboard/board');
}

export default async function PartnerBoardPage() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const isPlatformAdmin = effectiveRoles.some((role) =>
    ['super_admin', 'admin', 'org_admin'].includes(role),
  );

  let board: Awaited<ReturnType<typeof getHostShopBoard>> | null = null;
  try {
    board = await getHostShopBoard(user.id);
  } catch (error) {
    if (
      isPlatformAdmin &&
      error instanceof Error &&
      error.message === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED'
    ) {
      const rawPartners = await getHostShopAdminPartnerOptions();
      const partners = rawPartners.filter(
        (partner: any) =>
          partner.status === 'active' &&
          partner.approval_status === 'approved' &&
          partner.is_active !== false,
      );

      return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Admin portal access</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Choose an active approved Host Shop</h1>
            <p className="mt-3 max-w-2xl text-slate-700">
              Archived, inactive, pending, and test/draft partner submissions are excluded from this selector.
            </p>
            <form action={selectAdminPartner} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <select
                name="partnerId"
                required
                className="min-h-12 flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold text-slate-950"
              >
                <option value="">Select Host Shop</option>
                {partners.map((partner: any) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name} {partner.city ? `— ${partner.city}, ${partner.state || ''}` : ''}
                  </option>
                ))}
              </select>
              <button type="submit" className="min-h-12 rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white hover:bg-brand-blue-800">
                Open Host Shop portal
              </button>
            </form>
          </section>
        </main>
      );
    }
    throw error;
  }

  if (!board) redirect('/host-shop/dashboard');

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {isPlatformAdmin ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-blue-950">Admin Host Shop view</p>
            <p className="text-sm text-blue-900">Viewing {board.partner?.name || 'selected partner'} without changing your Admin role.</p>
          </div>
          <form action={clearAdminPartner}>
            <button className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-100">Change Host Shop</button>
          </form>
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Host Shop</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{board.partner?.name || board.shops[0]?.name || 'Host Shop Board'}</h1>
            <p className="mt-2 text-slate-600">{board.tradeInfo.label}</p>
            {board.shops[0]?.city ? <p className="mt-1 text-sm text-slate-500">{board.shops[0].city}, {board.shops[0].state}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${board.partner?.approval_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              {board.partner?.approval_status === 'approved' ? 'Approved Partner' : 'Pending Approval'}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${board.partner?.mou_signed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/host-shop/dashboard/apprentices" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-blue-300">
          <Users className="h-5 w-5 text-brand-blue-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active apprentices</p>
        </Link>
        <Link href="/host-shop/dashboard/hours/pending" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-amber-300">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.pendingHoursCount}</p>
          <p className="text-sm text-slate-600">Hours pending review</p>
        </Link>
        <Link href="/host-shop/dashboard/competencies" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-green-300">
          <CheckCircle2 className="h-5 w-5 text-brand-green-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.tradeInfo.hours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">OJT target</p>
        </Link>
        <Link href="/host-shop/dashboard/documents" className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-purple-300">
          <FileText className="h-5 w-5 text-purple-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">
            {board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}` : board.partner?.documents_verified ? '✓' : '—'}
          </p>
          <p className="text-sm text-slate-600">Required docs accepted</p>
        </Link>
      </div>

      {(board.missingDocuments.length > 0 || board.pendingDocuments.length > 0 || !board.partner?.onboarding_completed) ? (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">Host-site onboarding requires attention</h2>
          <p className="mt-1 text-sm text-amber-900">
            {board.missingDocuments.length} required document(s) missing · {board.pendingDocuments.length} in review.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!isPlatformAdmin && !board.partner?.mou_signed ? <Link href={board.onboardingPaths.signMou} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white">Sign MOU</Link> : null}
            {!isPlatformAdmin && !board.partner?.onboarding_completed ? <Link href={board.onboardingPaths.forms} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-950">Finish onboarding</Link> : null}
            <Link href={board.onboardingPaths.documents} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-bold text-amber-950">Documents</Link>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-black text-slate-950">Host Shop tools</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/host-shop/dashboard/match-requests" className="rounded-xl border border-slate-200 p-4 font-bold text-slate-900 hover:bg-slate-50">Match requests</Link>
          <Link href="/host-shop/dashboard/attendance/record" className="rounded-xl border border-slate-200 p-4 font-bold text-slate-900 hover:bg-slate-50">Record attendance</Link>
          <Link href="/host-shop/dashboard/reports" className="rounded-xl border border-slate-200 p-4 font-bold text-slate-900 hover:bg-slate-50">Reporting center</Link>
          <Link href="/host-shop/dashboard/profile" className="rounded-xl border border-slate-200 p-4 font-bold text-slate-900 hover:bg-slate-50">Shop profile</Link>
        </div>
      </section>
    </main>
  );
}
