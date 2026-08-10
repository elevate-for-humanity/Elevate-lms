import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import {
  getHostShopAdminPartnerOptions,
  getHostShopBoard,
  HOST_SHOP_ADMIN_COOKIE,
} from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import MatchRequestsButton from './MatchRequestsButton';

export const dynamic = 'force-dynamic';

async function selectAdminPartner(formData: FormData) {
  'use server';

  await requireRole(['super_admin', 'admin', 'org_admin']);
  const partnerId = String(formData.get('partnerId') ?? '').trim();
  if (!partnerId) redirect('/host-shop/dashboard/board');

  const db = await requireAdminClient();
  const { data: partner } = await db
    .from('partners')
    .select('id')
    .eq('id', partnerId)
    .maybeSingle();
  if (!partner) redirect('/host-shop/dashboard/board');

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
      const partners = await getHostShopAdminPartnerOptions();
      return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
              Admin portal access
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">Choose a Host Shop</h1>
            <p className="mt-3 max-w-2xl text-slate-700">
              Select the partner tenant you want to inspect. The selection is temporary and does not attach your Admin account to the shop.
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
              <button
                type="submit"
                className="min-h-12 rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white hover:bg-brand-blue-800"
              >
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
    <div className="space-y-6">
      {isPlatformAdmin && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-blue-950">Admin Host Shop view</p>
            <p className="text-sm text-blue-900">
              Viewing {board.partner?.name || 'selected partner'} without changing your Admin role.
            </p>
          </div>
          <form action={clearAdminPartner}>
            <button className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-bold text-blue-950 hover:bg-blue-100">
              Change Host Shop
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {board.partner?.name || board.shops[0]?.name || 'Host Shop Board'}
            </h1>
            <p className="text-slate-600 mt-1">{board.tradeInfo.label} · Host Shop</p>
            {board.shops[0]?.city && (
              <p className="text-sm text-slate-500 mt-0.5">{board.shops[0].city}, {board.shops[0].state}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${board.partner?.mou_signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${board.partner?.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {board.partner?.approval_status === 'approved' ? 'Approved Partner' : board.partner?.approval_status || 'Pending Approval'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <Users className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active Apprentices</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <Clock className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{board.pendingHoursCount}</p>
          <p className="text-sm text-slate-600">Hours Pending Review</p>
          {board.pendingHoursCount > 0 && (
            <Link href="/host-shop/dashboard/hours/pending" className="text-xs text-orange-600 hover:underline mt-1 block">Review now →</Link>
          )}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
          <p className="text-2xl font-bold">{board.tradeInfo.hours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">OJT Target ({board.tradeInfo.label.split(' ')[0]})</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <FileText className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">
            {board.requiredDocumentCount
              ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}`
              : board.partner?.documents_verified
                ? '✓'
                : '—'}
          </p>
          <p className="text-sm text-slate-600">Required Docs Accepted</p>
        </div>
      </div>

      {(board.missingDocuments.length > 0 || board.pendingDocuments.length > 0 || !board.partner?.onboarding_completed) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h2 className="font-semibold text-amber-950">Finish host-site onboarding</h2>
                <p className="mt-1 text-sm text-amber-900">
                  This Host Shop still has incomplete onboarding or compliance items.
                </p>
                <div className="mt-3 grid gap-2 text-sm text-amber-950 md:grid-cols-3">
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">MOU</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.mou_signed ? <CheckCircle className="h-3.5 w-3.5 text-brand-green-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                      {board.partner?.mou_signed ? 'Signed' : 'Needs signature'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">Onboarding forms</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.onboarding_completed ? <CheckCircle className="h-3.5 w-3.5 text-brand-green-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
                      {board.partner?.onboarding_completed ? 'Complete' : 'Needs completion'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/70 p-3">
                    <p className="font-medium">Documents</p>
                    <p className="mt-1 text-xs">{board.missingDocuments.length} missing · {board.pendingDocuments.length} in review</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap gap-2 md:justify-end">
              {!isPlatformAdmin && !board.partner?.mou_signed && (
                <Link href={board.onboardingPaths.signMou} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Sign MOU</Link>
              )}
              {!isPlatformAdmin && !board.partner?.onboarding_completed && (
                <Link href={board.onboardingPaths.forms} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Finish onboarding</Link>
              )}
              <Link href={board.onboardingPaths.documents} className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">Documents</Link>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Apprentice OJT Progress</h2>
          <Link href="/host-shop/dashboard/hours" className="text-sm text-blue-600 hover:underline">Manage Hours →</Link>
        </div>
        {board.apprentices.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No active apprentices yet.</p>
          </div>
        ) : (
          <div className="divide-y">
            {board.apprentices.map((apprentice) => {
              const pct = Math.min(100, Math.round((apprentice.ojt.completed / apprentice.ojt.required) * 100));
              return (
                <div key={apprentice.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{apprentice.name}</p>
                      <p className="text-xs text-slate-500">{apprentice.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {apprentice.ojt.completed.toLocaleString()} / {apprentice.ojt.required.toLocaleString()}h
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MatchRequestsButton />
        <Link href="/host-shop/dashboard/attendance/record" className="bg-white rounded-xl border p-5 hover:border-blue-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Record Attendance</h3>
          <p className="text-sm text-slate-600 mt-1">Log a training session</p>
        </Link>
        <Link href="/host-shop/dashboard/hours/pending" className="bg-white rounded-xl border p-5 hover:border-orange-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Verify Hours</h3>
          <p className="text-sm text-slate-600 mt-1">{board.pendingHoursCount} pending</p>
        </Link>
        <Link href="/host-shop/dashboard/competencies" className="bg-white rounded-xl border p-5 hover:border-purple-300 hover:shadow-sm transition block">
          <h3 className="font-semibold text-slate-900">Competency Reviews</h3>
          <p className="text-sm text-slate-600 mt-1">Approve skill reps</p>
        </Link>
      </div>
    </div>
  );
}
