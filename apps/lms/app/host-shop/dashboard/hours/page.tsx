import Link from 'next/link';
import { CheckCircle2, Clock, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Work Hours | Host Shop Portal', description: 'Review supervised work evidence and pending hour entries.', robots: { index: false, follow: false } };

export default async function HostShopHoursPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const competencyBased = board.tradeInfo.progressModel === 'competency_based';
  const progressConfigured = board.unconfiguredPrograms.length === 0;
  const totalApprovedHours = board.apprentices.reduce((sum, apprentice) => sum + (apprentice.ojt.completed || 0), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Work Hours & Evidence</h1><p className="mt-2 text-slate-600">Approved work time is retained as supervised employment/OJL evidence. {!progressConfigured ? 'Completion progress remains blocked until the registered-program standard is configured.' : competencyBased ? 'Appendix A completion progress is competency-based and is shown separately.' : 'Time-based progress is calculated only where the registered program uses an hour target.'}</p></div>
        <Link href="/host-shop/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to Host Shop Dashboard</Link>
      </div>

      {competencyBased ? <section className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 className="font-black">Barber progress rule</h2><p className="mt-1 text-sm font-semibold leading-6">Do not treat recorded hours as a 2,000-hour completion counter. Verify work time accurately, then use the Appendix A Competencies workspace to verify mastery of all {board.tradeInfo.competencyCount ?? 14} competencies. The related-instruction requirement is {board.tradeInfo.rtiHours ?? 260} RTI hours.</p></div></div></section> : null}
      {!progressConfigured ? <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><div><h2 className="font-black">Registered standard required</h2><p className="mt-1 text-sm font-semibold leading-6">Hours may be retained as supervised work evidence, but they cannot be converted into regulated completion progress until an active approved standard exists for {board.unconfiguredPrograms.map((program) => program.programSlug || 'the assigned occupation').join(', ')}.</p></div></div></section> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Users className="h-5 w-5 text-brand-blue-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p><p className="text-sm text-slate-600">Active apprentices</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Clock className="h-5 w-5 text-amber-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.pendingHoursCount}</p><p className="text-sm text-slate-600">Entries awaiting verification</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="h-5 w-5 text-brand-green-700"/><p className="mt-3 text-3xl font-black text-slate-950">{totalApprovedHours.toLocaleString()}h</p><p className="text-sm text-slate-600">Approved supervised work recorded</p></div>
      </div>

      {board.pendingHoursCount > 0 ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-black text-amber-950">Work entries require review</h2><p className="mt-1 text-sm text-amber-900">{board.pendingHoursCount} entr{board.pendingHoursCount === 1 ? 'y is' : 'ies are'} waiting for Host Shop verification.</p><Link href="/host-shop/dashboard/hours/pending" className="mt-4 inline-flex rounded-xl bg-amber-700 px-4 py-2 text-sm font-bold text-white hover:bg-amber-800">Review pending hours</Link></div> : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Apprentice work records</h2></div>
        {board.apprentices.length === 0 ? <div className="px-6 py-12 text-center text-slate-500">No active apprentice placements are assigned to this shop.</div> : (
          <div className="divide-y divide-slate-200">
            {board.apprentices.map((apprentice) => {
              const required = apprentice.ojt.required;
              const completed = apprentice.ojt.completed || 0;
              const pct = required ? Math.min(100, Math.round((completed / required) * 100)) : 0;
              return <div key={apprentice.id} className="px-5 py-5 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-950">{apprentice.name}</p><p className="text-sm text-slate-500">{apprentice.email || 'No email on profile'}</p></div><p className="text-sm font-black text-slate-900">{completed.toLocaleString()} approved hours{required ? ` / ${required.toLocaleString()} required` : ' recorded'}</p></div>{required ? <><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${pct}%` }}/></div><p className="mt-1 text-right text-xs text-slate-500">{pct}% of the time-based requirement</p></> : apprentice.ojt.progressModel === 'competency_based' ? <p className="mt-2 text-xs font-semibold text-cyan-800">Competency-based program: work hours are evidence, not the completion percentage.</p> : <p className="mt-2 text-xs font-semibold text-amber-900">Completion progress is blocked until the registered-program standard is configured.</p>}</div>;
            })}
          </div>
        )}
      </section>
    </main>
  );
}
