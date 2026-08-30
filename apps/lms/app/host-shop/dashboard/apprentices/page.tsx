import Link from 'next/link';
import { Clock, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Apprentices | Host Shop Portal', description: 'View apprentices currently assigned to this Host Shop.', robots: { index: false, follow: false } };

export default async function HostShopApprenticesPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const competencyBased = board.tradeInfo.progressModel === 'competency_based';
  const progressConfigured = board.unconfiguredPrograms.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Assigned Apprentices</h1><p className="mt-2 text-slate-600">Only active placements assigned to this Host Shop are shown.</p></div>
        <Link href="/host-shop/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to Host Shop Dashboard</Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Users className="h-5 w-5 text-brand-blue-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p><p className="text-sm text-slate-600">Active placements</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Clock className="h-5 w-5 text-amber-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.pendingHoursCount}</p><p className="text-sm text-slate-600">Work entries pending review</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><ShieldCheck className="h-5 w-5 text-brand-green-700"/><p className="mt-3 text-3xl font-black text-slate-950">{!progressConfigured ? 'Blocked' : competencyBased ? `${board.tradeInfo.competencyCount ?? 14} skills` : `${Number(board.tradeInfo.hours ?? 0).toLocaleString()}h`}</p><p className="text-sm text-slate-600">{!progressConfigured ? 'Registered-program standard not configured' : competencyBased ? `${board.tradeInfo.rtiHours ?? 260} RTI hours · competency-based` : `OJT target · ${board.tradeInfo.label}`}</p></div>
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Current roster</h2></div>
        {board.apprentices.length === 0 ? (
          <div className="px-6 py-12 text-center"><Users className="mx-auto h-10 w-10 text-slate-300"/><h3 className="mt-3 font-bold text-slate-900">No active apprentices assigned</h3><p className="mt-1 text-sm text-slate-500">Approved match requests and active placements will appear here automatically.</p><Link href="/host-shop/dashboard/match-requests" className="mt-5 inline-flex rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-blue-800">Review match requests</Link></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {board.apprentices.map((apprentice) => {
              const completedHours = apprentice.ojt.completed || 0;
              const competency = apprentice.competency;
              const requiredHours = apprentice.ojt.required;
              const hourPct = requiredHours ? Math.min(100, Math.round((completedHours / requiredHours) * 100)) : 0;
              const competencyPct = competency ? Math.min(100, Math.round((competency.completed / competency.required) * 100)) : 0;
              return (
                <article key={apprentice.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0"><h3 className="text-lg font-black text-slate-950">{apprentice.name}</h3><p className="truncate text-sm text-slate-600">{apprentice.email || 'No email on profile'}</p><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{(apprentice.program_slug || board.programType || 'apprenticeship').replace(/[-_]/g, ' ')}{apprentice.start_date ? ` · Started ${new Date(apprentice.start_date).toLocaleDateString()}` : ''}</p></div>
                    <div className="md:w-80">
                      {competency ? <><div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-800">Appendix A competency progress</span><span className="font-black text-slate-950">{competency.completed} / {competency.required}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${competencyPct}%` }}/></div><p className="mt-1 text-right text-xs text-slate-500">{competencyPct}% verified · {completedHours.toLocaleString()} approved work hours recorded</p></> : requiredHours ? <><div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-800">OJT progress</span><span className="font-black text-slate-950">{completedHours.toLocaleString()} / {requiredHours.toLocaleString()}h</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${hourPct}%` }}/></div><p className="mt-1 text-right text-xs text-slate-500">{hourPct}% complete</p></> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Progress is blocked until the registered-program standard is configured.</div>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3"><Link href="/host-shop/dashboard/hours/pending" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Verify pending hours</Link><Link href="/host-shop/dashboard/competencies" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Competency sign-offs</Link></div>
    </main>
  );
}
