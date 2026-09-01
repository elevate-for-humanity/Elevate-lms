import Link from 'next/link';
import { Clock, Download, FileText, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reports | Host Shop Portal', description: 'View live Host Shop apprenticeship reporting metrics.', robots: { index: false, follow: false } };

export default async function HostShopReportsPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const competencyBased = board.tradeInfo.progressModel === 'competency_based';
  const progressConfigured = board.unconfiguredPrograms.length === 0;
  const approvedHours = board.apprentices.reduce((sum, apprentice) => sum + (apprentice.ojt.completed || 0), 0);
  const requiredHours = board.apprentices.reduce((sum, apprentice) => sum + Number(apprentice.ojt.required ?? 0), 0);
  const hourCompletionRate = requiredHours > 0 ? Math.round((approvedHours / requiredHours) * 100) : 0;
  const totalCompetenciesComplete = board.apprentices.reduce((sum, apprentice) => sum + Number(apprentice.competency?.completed ?? 0), 0);
  const totalCompetenciesRequired = board.apprentices.reduce((sum, apprentice) => sum + Number(apprentice.competency?.required ?? 0), 0);
  const competencyCompletionRate = totalCompetenciesRequired > 0 ? Math.round((totalCompetenciesComplete / totalCompetenciesRequired) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Reporting Center</h1><p className="mt-2 text-slate-600">Live operational metrics from the Host Shop dashboard. Work evidence and completion progress are reported separately.</p></div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to dashboard</Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Users className="h-5 w-5 text-brand-blue-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p><p className="text-sm text-slate-600">Active apprentices</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Clock className="h-5 w-5 text-amber-700"/><p className="mt-3 text-3xl font-black text-slate-950">{approvedHours.toLocaleString()}h</p><p className="text-sm text-slate-600">Approved supervised work evidence</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><ShieldCheck className="h-5 w-5 text-brand-green-700"/><p className="mt-3 text-3xl font-black text-slate-950">{!progressConfigured ? 'Blocked' : competencyBased ? `${competencyCompletionRate}%` : `${hourCompletionRate}%`}</p><p className="text-sm text-slate-600">{!progressConfigured ? 'Registered-program standard not configured' : competencyBased ? `Aggregate Appendix A competency progress (${totalCompetenciesComplete}/${totalCompetenciesRequired || board.apprentices.length * (board.tradeInfo.competencyCount ?? 14)})` : 'Aggregate time-based OJT completion'}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><FileText className="h-5 w-5 text-purple-700"/><p className="mt-3 text-3xl font-black text-slate-950">{board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}` : '—'}</p><p className="text-sm text-slate-600">Required docs accepted</p></div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">Operational reports</h2><p className="mt-1 text-sm text-slate-600">Open the underlying live record set before exporting or certifying compliance information.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link href="/host-shop/dashboard/hours" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40"><h3 className="font-black text-slate-950">Work hours & evidence</h3><p className="mt-1 text-sm text-slate-600">Approved work totals and pending verification counts. Barber work hours are not presented as a completion target.</p></Link>
          <Link href="/host-shop/dashboard/attendance" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40"><h3 className="font-black text-slate-950">Attendance</h3><p className="mt-1 text-sm text-slate-600">Recorded training sessions and attendance metrics.</p></Link>
          <Link href="/host-shop/dashboard/competencies" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40"><h3 className="font-black text-slate-950">Competency sign-offs</h3><p className="mt-1 text-sm text-slate-600">Appendix A verification records and competency-based progress.</p></Link>
          <Link href="/host-shop/dashboard/documents" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40"><h3 className="font-black text-slate-950">Compliance documents</h3><p className="mt-1 text-sm text-slate-600">Required Host Shop documents, signatures, and review status.</p></Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">Secure exports</h2>
        <p className="mt-1 text-sm text-slate-600">Exports contain only records assigned to this Host Shop. Incomplete compliance remains labeled as outstanding.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[['overview','Summary'],['apprentices','Apprentices'],['hours','Work hours'],['attendance','Attendance'],['compliance','Compliance']].map(([type,label]) => <a key={type} href={`/api/host-shop/reports/export?type=${type}`} download className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"><Download className="h-4 w-4"/>{label} CSV</a>)}
        </div>
      </section>
    </main>
  );
}
