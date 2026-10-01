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
  const hybrid = board.tradeInfo.progressModel === 'hybrid';
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><ShieldCheck className="h-5 w-5 text-brand-green-700"/><p className="mt-3 text-3xl font-black text-slate-950">{!progressConfigured ? 'Blocked' : competencyBased ? `${board.tradeInfo.competencyCount ?? 0} skills` : hybrid ? '2,000–2,500h' : `${Number(board.tradeInfo.hours ?? 0).toLocaleString()}h`}</p><p className="text-sm text-slate-600">{!progressConfigured ? 'Registered-program standard not configured' : competencyBased ? `${board.tradeInfo.rtiHours ?? 0} RTI hours · competency-based` : hybrid ? `${board.tradeInfo.rtiHours ?? 154} RTI hours · RAPIDS hybrid` : `OJT target · ${board.tradeInfo.label}`}</p></div>
      </div>

      <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-800">How to run your apprenticeship</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">What your Host Shop is responsible for each week</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">You are the apprentice's supervised worksite. Elevate manages the registered-program record and related training coordination; your shop provides paid, supervised on-the-job learning and verifies what actually happened at work.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['1. Schedule paid work', 'Give the apprentice real work in the registered occupation. Follow the wage method and progression shown in Wage Compliance. Do not count unpaid practice as paid OJL.'],
            ['2. Clock-in and geofence', 'The apprentice clocks in and out from the assigned worksite. Review exceptions when a clock-out is missed or location evidence needs confirmation.'],
            ['3. Review hours every week', 'Open Work Hours or Verify pending hours. Compare the entry with the schedule, correct only documented errors, then approve or reject it. Approved hours become OJL evidence.'],
            ['4. Teach and supervise skills', 'Provide hands-on work that matches the occupation. Do not sign a competency until you personally observed acceptable performance and any required evidence is present.'],
            ['5. Sign competencies', 'Open Competencies to review Appendix A skills. Record the completion date and mentor/supervisor identity. Skills and hours are different records and both matter.'],
            ['6. Keep RTI separate', 'RTI means Related Technical Instruction: classroom/online instruction tied to the occupation. The shop should not convert ordinary work hours into RTI. Elevate tracks required RTI separately.'],
            ['7. Check progress', 'The apprentice card below shows approved work hours, the required work target, percentage complete, and competency progress when the registered standard uses competencies.'],
            ['8. Resolve exceptions', 'Use Documents, Compliance, and PARIS when something is missing or unclear. Do not invent hours, competencies, wages, or dates just to clear an alert.'],
            ['9. Communicate in the portal', 'Use dashboard Email, Phone, Meetings, and PARIS so program communication stays connected to the apprentice and Host Shop record.'],
          ].map(([title, body]) => <div key={title} className="rounded-xl border border-blue-100 bg-white p-4"><h3 className="font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}
        </div>
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <p><strong>OJL/OJT:</strong> supervised paid work in the occupation. <strong>RTI:</strong> Related Technical Instruction completed separately from work hours. <strong>Appendix A:</strong> the registered occupation's work processes/competencies used to document skill development. <strong>RAPIDS:</strong> the U.S. Department of Labor Registered Apprenticeship system that holds the registered program standard.</p>
          {hybrid ? <p className="mt-2"><strong>For this hybrid program:</strong> the registered work term is 2,000–2,500 hours, with 154 RTI hours tracked separately. The apprentice's actual progress appears below; the 2,000-hour figure is the minimum work-term reference, not a statement that the apprentice has already completed those hours.</p> : null}
        </div>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/host-shop/dashboard/hours/pending" className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white hover:bg-blue-800">Review weekly hours</Link><Link href="/host-shop/dashboard/competencies" className="rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black text-blue-900 hover:bg-blue-50">Review competencies</Link><Link href="/host-shop/dashboard/compliance" className="rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-black text-blue-900 hover:bg-blue-50">Check compliance</Link></div>
      </section>

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
                      {competency ? <><div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-800">Appendix A competency progress</span><span className="font-black text-slate-950">{competency.completed} / {competency.required}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${competencyPct}%` }}/></div><p className="mt-1 text-right text-xs text-slate-500">{competencyPct}% verified · {completedHours.toLocaleString()} approved work hours recorded</p></> : requiredHours ? <><div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-800">{apprentice.tradeInfo.progressModel === 'hybrid' ? 'Hybrid term work progress' : 'OJT progress'}</span><span className="font-black text-slate-950">{completedHours.toLocaleString()} / {requiredHours.toLocaleString()}h</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-700" style={{ width: `${hourPct}%` }}/></div><p className="mt-1 text-right text-xs text-slate-500">{apprentice.tradeInfo.progressModel === 'hybrid' ? `${hourPct}% of the 2,000-hour minimum term · 154 RTI tracked separately` : `${hourPct}% complete`}</p></> : <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Progress is blocked until the registered-program standard is configured.</div>}
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
