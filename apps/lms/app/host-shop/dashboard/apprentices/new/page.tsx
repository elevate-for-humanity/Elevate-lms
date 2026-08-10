import Link from 'next/link';
import { ArrowLeft, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Add Apprentice | Host Shop Portal',
  description: 'Use the approved match and placement workflow to add apprentices to a host shop.',
  robots: { index: false, follow: false },
};

export default async function NewApprenticePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/host-shop/dashboard/apprentices" className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" /> Back to apprentices
      </Link>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-700">
          <UserPlus className="h-6 w-6" />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
          {board.partner?.name || 'Host Shop'}
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Add an apprentice through the placement workflow</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-700">
          Host shops cannot create arbitrary student records. An apprentice must be an existing Elevate learner and become assigned to this shop through an approved match or placement record. This keeps the roster, hours, competencies, and compliance records tied to the correct tenant.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <Users className="h-5 w-5 text-brand-blue-700" />
            <p className="mt-3 text-2xl font-black text-slate-950">{board.apprentices.length}</p>
            <p className="text-sm text-slate-600">Current active placements</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <ShieldCheck className="h-5 w-5 text-brand-green-700" />
            <p className="mt-3 font-black text-slate-950">Tenant-safe placement</p>
            <p className="mt-1 text-sm text-slate-600">Approved records only; no demo or manually fabricated users.</p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/host-shop/dashboard/match-requests" className="rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800">
            Review match requests
          </Link>
          <Link href="/host-shop/dashboard/apprentices" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 hover:bg-slate-50">
            View current roster
          </Link>
        </div>
      </section>
    </main>
  );
}
