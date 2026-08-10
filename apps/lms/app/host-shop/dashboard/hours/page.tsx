import Link from 'next/link';
import { CheckCircle2, Clock, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Hours | Host Shop Portal',
  description: 'Review real apprentice OJT progress and pending hour entries.',
  robots: { index: false, follow: false },
};

export default async function HostShopHoursPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  const totalApprovedHours = board.apprentices.reduce(
    (sum, apprentice) => sum + (apprentice.ojt.completed || 0),
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
            {board.partner?.name || 'Host Shop'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Hours & OJT Progress</h1>
          <p className="mt-2 text-slate-600">
            This page uses approved placements and hour entries assigned to this host shop.
          </p>
        </div>
        <Link
          href="/host-shop/dashboard/board"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          Back to Host Shop Board
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Users className="h-5 w-5 text-brand-blue-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active apprentices</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.pendingHoursCount}</p>
          <p className="text-sm text-slate-600">Entries awaiting verification</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <CheckCircle2 className="h-5 w-5 text-brand-green-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{totalApprovedHours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">Approved OJT hours shown</p>
        </div>
      </div>

      {board.pendingHoursCount > 0 ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-black text-amber-950">Hours require review</h2>
          <p className="mt-1 text-sm text-amber-900">
            {board.pendingHoursCount} hour entr{board.pendingHoursCount === 1 ? 'y is' : 'ies are'} waiting for host-shop verification.
          </p>
          <Link
            href="/host-shop/dashboard/hours/pending"
            className="mt-4 inline-flex rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800"
          >
            Review pending hours
          </Link>
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-black text-slate-950">Apprentice OJT totals</h2>
        </div>
        {board.apprentices.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500">
            No active apprentice placements are assigned to this shop.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {board.apprentices.map((apprentice) => {
              const required = apprentice.ojt.required || board.tradeInfo.hours;
              const completed = apprentice.ojt.completed || 0;
              const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0;

              return (
                <div key={apprentice.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-950">{apprentice.name}</p>
                      <p className="text-sm text-slate-500">{apprentice.email || 'No email on profile'}</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">
                      {completed.toLocaleString()} / {required.toLocaleString()} hours
                    </p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-xs text-slate-500">{pct}% complete</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
