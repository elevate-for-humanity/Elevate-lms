import Link from 'next/link';
import { ApprenticeWorkForms } from './ApprenticeWorkForms.client';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Work Hours | Host Shop Portal',
  description: 'Review supervised work evidence and pending hour entries.',
  robots: { index: false, follow: false },
};

export default async function HostShopHoursPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const competencyBased = board.tradeInfo.progressModel === 'competency_based';
  const hybrid = board.tradeInfo.progressModel === 'hybrid';
  const progressConfigured = board.unconfiguredPrograms.length === 0;
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
          <h1 className="mt-2 text-3xl font-black text-slate-950">Work Hours</h1>
        </div>
        <Link
          href="/host-shop/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
        >
          Back to Host Shop Dashboard
        </Link>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ApprenticeWorkForms
          apprentices={board.apprentices.map((apprentice) => ({
            id: apprentice.id,
            name: apprentice.name,
            program_slug: apprentice.program_slug,
          }))}
        />
        <aside aria-label="Hours summary and help" className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm">
            <span>
              {totalApprovedHours.toLocaleString()} approved hours · {board.pendingHoursCount}{' '}
              awaiting review
            </span>
            <Link
              href="/host-shop/dashboard/hours/pending"
              className="inline-flex min-h-11 items-center font-bold underline"
            >
              Review submitted hours →
            </Link>
          </div>
          <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
            <summary className="min-h-11 cursor-pointer font-bold">
              Help with hours and training requirements
            </summary>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Enter completed supervised work only. Review dates, breaks, and work performed before
              submitting. Submitted hours wait for supervisor review; theory instruction is recorded
              separately.
            </p>
            <p className="mt-2 text-slate-600">
              Approved work time is retained as supervised employment/OJL evidence.{' '}
              {!progressConfigured
                ? 'Completion progress remains blocked until the registered-program standard is configured.'
                : competencyBased
                  ? 'Appendix A completion progress is competency-based and is shown separately.'
                  : hybrid
                    ? 'Approved work entries document progress toward the registered Hair Stylist hybrid term; 154 RTI hours and required work-process completion are tracked separately.'
                    : 'Approved entries automatically update the time-based apprenticeship progress target.'}
            </p>
            {competencyBased ? (
              <section className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950">
                <div className="flex gap-3">
                  <div>
                    <h2 className="font-black">Competency-based progress rule</h2>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      Do not treat recorded hours as the completion counter. Verify work time
                      accurately, then use the Competencies workspace to review progress across all{' '}
                      {board.tradeInfo.competencyCount ?? 0} registered competencies. The
                      related-instruction requirement is {board.tradeInfo.rtiHours ?? 0} RTI hours.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
            {hybrid ? (
              <section className="mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 text-violet-950">
                <div className="flex gap-3">
                  <div>
                    <h2 className="font-black">Hair Stylist hybrid progress rule</h2>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      RAPIDS 0096HY V1 uses a 2,000–2,500-hour hybrid term with 154 RTI hours. The
                      500-hour figure is probation only. Verify supervised work accurately and keep
                      RTI and required work-process documentation separate.
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
            {!progressConfigured ? (
              <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
                <div className="flex gap-3">
                  <div>
                    <h2 className="font-black">Registered standard required</h2>
                    <p className="mt-1 text-sm font-semibold leading-6">
                      Hours may be retained as supervised work evidence, but they cannot be
                      converted into regulated completion progress until an active approved standard
                      exists for{' '}
                      {board.unconfiguredPrograms
                        .map((program) => program.programSlug || 'the assigned occupation')
                        .join(', ')}
                      .
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </details>
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="font-black text-slate-950">Apprentice work records</h2>
            </div>
            {board.apprentices.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No active apprentice placements are assigned to this shop.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {board.apprentices.map((apprentice) => {
                  const required = apprentice.ojt.required;
                  const completed = apprentice.ojt.completed || 0;
                  const pct = required
                    ? Math.min(100, Math.round((completed / required) * 100))
                    : 0;
                  return (
                    <div key={apprentice.id} className="px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-black text-slate-950">{apprentice.name}</p>
                          <p className="text-sm text-slate-500">
                            {apprentice.email || 'No email on profile'}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900">
                          {completed.toLocaleString()} approved hours
                          {required ? ` / ${required.toLocaleString()} required` : ' recorded'}
                        </p>
                      </div>
                      {required ? (
                        <>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-blue-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 text-right text-xs text-slate-500">
                            {apprentice.ojt.progressModel === 'hybrid'
                              ? `${pct}% of the 2,000-hour minimum hybrid term`
                              : `${pct}% of the time-based requirement`}
                          </p>
                        </>
                      ) : apprentice.ojt.progressModel === 'competency_based' ? (
                        <p className="mt-2 text-xs font-semibold text-cyan-800">
                          Competency-based program: work hours are evidence, not the completion
                          percentage.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-amber-900">
                          Completion progress is blocked until the registered-program standard is
                          configured.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
