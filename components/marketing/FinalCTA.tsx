// components/marketing/FinalCTA.tsx
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="   ">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-950/95 px-6 py-10 ring-1 ring-emerald-500/40 sm:px-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:items-center">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
                Ready to see what&apos;s possible?
              </h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                For learners, employers, and partners who want more than
                business-as-usual training.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Elevate plugs into the systems you already work with — workforce
                boards, courts, employers, and community partners. Together we
                make sure funded training actually leads to outcomes.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/apply"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300"
                >
                  I&apos;m ready to explore training
                </Link>
                <Link
                  href="/employers"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-white hover:border-brand-red-300 hover:bg-slate-900"
                >
                  I&apos;m an employer or partner
                </Link>
              </div>
              <p className="text-xs text-white">
                Starting in Marion County with approvals expanding as new
                partners and locations come online.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
