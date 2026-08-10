import Link from 'next/link';
import { AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES, normalizeRoles } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getHostShopBoard, getHostShopBoardForPartner } from '@/lib/partner/board';
import MatchRequestsButton from './MatchRequestsButton';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ partnerId?: string }>;
};

async function AdminHostShopSelector() {
  const db = await requireAdminClient();
  const { data: partners } = await db
    .from('partners')
    .select('id, name, dba, city, state, partner_type, program_type, approval_status, status')
    .eq('approval_status', 'approved')
    .in('partner_type', ['barber', 'salon', 'host_shop', 'cosmetology_school', 'training_site'])
    .order('name');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Admin portal override</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Choose a Host Shop to preview</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
          Admin access never selects a shop implicitly. Choose the exact approved partner whose Host Shop
          dashboard you need to review. The preview remains scoped to that partner only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(partners || []).map((partner: any) => (
          <Link
            key={partner.id}
            href={`/host-shop/dashboard/board?partnerId=${encodeURIComponent(partner.id)}`}
            className="rounded-xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h2 className="font-bold text-slate-950">{partner.dba || partner.name}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {[partner.city, partner.state].filter(Boolean).join(', ') || 'Location not set'}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {partner.program_type || partner.partner_type || 'Host Shop'}
            </p>
          </Link>
        ))}
      </div>

      {(!partners || partners.length === 0) && (
        <div className="rounded-xl border bg-white p-8 text-center text-slate-600">
          No approved Host Shop partners are available for preview.
        </div>
      )}
    </div>
  );
}

export default async function PartnerBoardPage({ searchParams }: PageProps) {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const roles = normalizeRoles(effectiveRoles);
  const isPlatformAdmin = roles.includes('admin') || roles.includes('super_admin');
  const { partnerId } = await searchParams;

  if (isPlatformAdmin && !partnerId) {
    return <AdminHostShopSelector />;
  }

  const board =
    isPlatformAdmin && partnerId
      ? await getHostShopBoardForPartner(partnerId)
      : await getHostShopBoard(user.id);

  return (
    <div className="space-y-6">
      {isPlatformAdmin && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span>
            Admin preview: <strong>{board.partner?.name || 'Host Shop'}</strong>
          </span>
          <Link href="/host-shop/dashboard/board" className="font-bold hover:underline">
            Switch shop
          </Link>
        </div>
      )}

      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {board.partner?.name || board.shops[0]?.name || 'Host Shop Board'}
            </h1>
            <p className="mt-1 text-slate-600">{board.tradeInfo.label} · Host Shop</p>
            {board.shops[0]?.city && (
              <p className="mt-0.5 text-sm text-slate-500">
                {board.shops[0].city}, {board.shops[0].state}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                board.partner?.mou_signed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                board.partner?.approval_status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {board.partner?.approval_status === 'approved'
                ? 'Approved Partner'
                : board.partner?.approval_status || 'Pending Approval'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <Users className="mb-2 h-5 w-5 text-blue-500" />
          <p className="text-2xl font-bold">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active Apprentices</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <Clock className="mb-2 h-5 w-5 text-amber-500" />
          <p className="text-2xl font-bold">{board.pendingHoursCount}</p>
          <p className="text-sm text-slate-600">Hours Pending Review</p>
          {board.pendingHoursCount > 0 && !isPlatformAdmin && (
            <Link
              href="/host-shop/dashboard/hours/pending"
              className="mt-1 block text-xs text-orange-700 hover:underline"
            >
              Review now →
            </Link>
          )}
        </div>
        <div className="rounded-xl border bg-white p-5">
          <TrendingUp className="mb-2 h-5 w-5 text-green-600" />
          <p className="text-2xl font-bold">{board.tradeInfo.hours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">
            OJT Target ({board.tradeInfo.label.split(' ')[0]})
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <FileText className="mb-2 h-5 w-5 text-purple-600" />
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

      {(board.missingDocuments.length > 0 ||
        board.pendingDocuments.length > 0 ||
        !board.partner?.onboarding_completed) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <h2 className="font-semibold text-amber-950">Finish host-site onboarding</h2>
                <p className="mt-1 text-sm text-amber-900">
                  Finish onboarding and required documents before apprentices are fully placed at this site.
                </p>
                <div className="mt-3 grid gap-2 text-sm text-amber-950 md:grid-cols-3">
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="font-medium">MOU</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.mou_signed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-700" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                      )}
                      {board.partner?.mou_signed ? 'Signed' : 'Needs signature'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="font-medium">Onboarding forms</p>
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      {board.partner?.onboarding_completed ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-700" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                      )}
                      {board.partner?.onboarding_completed ? 'Complete' : 'Needs completion'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white/80 p-3">
                    <p className="font-medium">Documents</p>
                    <p className="mt-1 text-xs">
                      {board.missingDocuments.length} missing · {board.pendingDocuments.length} in review
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {!isPlatformAdmin && (
              <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                {!board.partner?.mou_signed && (
                  <Link
                    href={board.onboardingPaths.signMou}
                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                  >
                    Sign MOU
                  </Link>
                )}
                {!board.partner?.onboarding_completed && (
                  <Link
                    href={board.onboardingPaths.forms}
                    className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                  >
                    Finish onboarding
                  </Link>
                )}
                <Link
                  href={board.onboardingPaths.documents}
                  className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
                >
                  Upload documents
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-slate-900">Apprentice OJT Progress</h2>
          {!isPlatformAdmin && (
            <Link href="/host-shop/dashboard/hours" className="text-sm font-semibold text-blue-700 hover:underline">
              Manage Hours →
            </Link>
          )}
        </div>
        {board.apprentices.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-600">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p>No active apprentices yet.</p>
            <p className="mt-1 text-sm">Contact Elevate to match apprentice candidates to this shop.</p>
          </div>
        ) : (
          <div className="divide-y">
            {board.apprentices.map((apprentice) => {
              const pct = apprentice.ojt.required
                ? Math.min(100, Math.round((apprentice.ojt.completed / apprentice.ojt.required) * 100))
                : 0;
              return (
                <div key={apprentice.id} className="px-6 py-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{apprentice.name}</p>
                      <p className="text-xs text-slate-600">{apprentice.email}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {apprentice.ojt.completed.toLocaleString()} / {apprentice.ojt.required.toLocaleString()}h
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-orange-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isPlatformAdmin && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <MatchRequestsButton />
          <Link
            href="/host-shop/dashboard/attendance/record"
            className="block rounded-xl border bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">Record Attendance</h3>
            <p className="mt-1 text-sm text-slate-600">Log a training session</p>
          </Link>
          <Link
            href="/host-shop/dashboard/hours/pending"
            className="block rounded-xl border bg-white p-5 transition hover:border-orange-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">Verify Hours</h3>
            <p className="mt-1 text-sm text-slate-600">{board.pendingHoursCount} pending</p>
          </Link>
          <Link
            href="/host-shop/dashboard/competencies"
            className="block rounded-xl border bg-white p-5 transition hover:border-purple-300 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">Competency Reviews</h3>
            <p className="mt-1 text-sm text-slate-600">Approve skill reps</p>
          </Link>
        </div>
      )}
    </div>
  );
}
