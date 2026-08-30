import Link from 'next/link';
import { AlertTriangle, BookOpen, CheckCircle2, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { getHostShopBoard } from '@/lib/partner/board';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Programs & Standards | Host Shop Portal',
  description: 'View the canonical occupation and registered-program status assigned to this Host Shop.',
  robots: { index: false, follow: false },
};

export default async function HostShopProgramsPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const configured = board.unconfiguredPrograms.length === 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Programs & Standards</h1>
          <p className="mt-2 text-slate-600">Only programs assigned to this Host Shop are shown. The former all-program fallback has been removed.</p>
        </div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800">Back to dashboard</Link>
      </div>

      <section className={`mt-6 rounded-3xl border p-7 ${configured ? 'border-green-200 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
        {configured ? <CheckCircle2 className="h-8 w-8 text-green-700" /> : <AlertTriangle className="h-8 w-8 text-amber-800" />}
        <h2 className="mt-4 text-2xl font-black text-slate-950">{board.tradeInfo.label}</h2>
        <p className="mt-2 leading-7 text-slate-700">
          {configured
            ? `${board.registeredPrograms.length} active registered occupation standard${board.registeredPrograms.length === 1 ? '' : 's'} available for regulated progress.`
            : 'No active approved registered-program standard is configured for the assigned occupation. Competency, RTI, wage-milestone, and regulated completion credit remain blocked.'}
        </p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <BookOpen className="h-5 w-5 text-brand-blue-700" />
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">Canonical program</p>
          <p className="mt-1 text-xl font-black text-slate-950">{board.programType || 'Not assigned'}</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <Users className="h-5 w-5 text-brand-green-700" />
          <p className="mt-3 text-sm font-bold uppercase tracking-wide text-slate-500">Active placements</p>
          <p className="mt-1 text-xl font-black text-slate-950">{board.apprentices.length}</p>
        </section>
      </div>
    </main>
  );
}
