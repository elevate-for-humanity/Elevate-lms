import Link from 'next/link';
import { Clock, FileText, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reports | Host Shop Portal',
  description: 'View live host-shop apprenticeship reporting metrics.',
  robots: { index: false, follow: false },
};

export default async function HostShopReportsPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  const approvedHours = board.apprentices.reduce(
    (sum, apprentice) => sum + (apprentice.ojt.completed || 0),
    0,
  );
  const requiredHours = board.apprentices.reduce(
    (sum, apprentice) => sum + (apprentice.ojt.required || board.tradeInfo.hours),
    0,
  );
  const completionRate = requiredHours > 0 ? Math.round((approvedHours / requiredHours) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
            {board.partner?.name || 'Host Shop'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Reporting Center</h1>
          <p className="mt-2 text-slate-600">Live operational metrics from the host-shop board. Fabricated report history has been removed.</p>
        </div>
        <Link href="/host-shop/dashboard/board" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
          Back to board
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Users className="h-5 w-5 text-brand-blue-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active apprentices</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{approvedHours.toLocaleString()}h</p>
          <p className="text-sm text-slate-600">Approved OJT hours</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <ShieldCheck className="h-5 w-5 text-brand-green-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{completionRate}%</p>
          <p className="text-sm text-slate-600">Aggregate OJT completion</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <FileText className="h-5 w-5 text-purple-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">
            {board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}` : '—'}
          </p>
          <p className="text-sm text-slate-600">Required docs accepted</p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-slate-950">Operational reports</h2>
        <p className="mt-1 text-sm text-slate-600">Open the underlying live record set before exporting or certifying any compliance information.</p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Link href="/host-shop/dashboard/hours" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40">
            <h3 className="font-black text-slate-950">Hours & OJT</h3>
            <p className="mt-1 text-sm text-slate-600">Approved OJT totals and pending verification counts.</p>
          </Link>
          <Link href="/host-shop/dashboard/attendance" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40">
            <h3 className="font-black text-slate-950">Attendance</h3>
            <p className="mt-1 text-sm text-slate-600">Recorded training sessions and attendance metrics.</p>
          </Link>
          <Link href="/host-shop/dashboard/competencies" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40">
            <h3 className="font-black text-slate-950">Competency sign-offs</h3>
            <p className="mt-1 text-sm text-slate-600">Appendix A competency verification records.</p>
          </Link>
          <Link href="/host-shop/dashboard/documents" className="rounded-xl border border-slate-200 p-5 hover:border-brand-blue-300 hover:bg-brand-blue-50/40">
            <h3 className="font-black text-slate-950">Compliance documents</h3>
            <p className="mt-1 text-sm text-slate-600">Required host-site documents and review status.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
