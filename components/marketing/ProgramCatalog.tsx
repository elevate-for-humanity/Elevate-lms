// components/marketing/ProgramCatalog.tsx
import Link from "next/link";

const paths = ["Healthcare", "Skilled Trades", "CDL", "Barber", "Re-entry"];

const programs = [
  {
    name: "Medical Assistant",
    summary:
      "Clinical skills, patient interaction, and hands-on training for clinics, hospitals, and specialty practices.",
    meta: "~5 months · Healthcare",
    href: "/programs/medical-assistant",
  },
  {
    name: "Barber Apprenticeship",
    summary:
      "Earn while you learn in real barbershops while stacking hours toward licensure and long-term income.",
    meta: "Hours-based · Barber",
    href: "/programs/barber-apprenticeship",
  },
  {
    name: "HVAC Technician",
    summary:
      "Heating, cooling, and refrigeration training to step into in-demand skilled trades roles.",
    meta: "Varies by partner · Skilled Trades",
    href: "/programs/hvac-technician",
  },
];

export function ProgramCatalog() {
  return (
    <section className="bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-orange-300">
              Popular programs
            </h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-50">
              Training that leads to real employment.
            </p>
            <p className="mt-3 text-sm text-slate-300">
              Every pathway is built with an employer or workforce need behind
              it. No random classes — just programs that connect to real roles,
              apprenticeships, and income.
            </p>
          </div>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-50 hover:border-brand-red-300 hover:bg-slate-900"
          >
            View full program directory →
          </Link>
        </header>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {paths.map((path) => (
            <span
              key={path}
              className="rounded-full bg-slate-900 px-3 py-2 text-slate-200 ring-1 ring-slate-700"
            >
              {path}
            </span>
          ))}
        </div>

        {/* Program cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.name}
              href={program.href}
              className="group flex flex-col rounded-3xl bg-slate-900/80 p-5 ring-1 ring-slate-800 transition hover:-translate-y-1 hover:ring-emerald-400/60"
            >
              <h3 className="text-base font-semibold text-slate-50">
                {program.name}
              </h3>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {program.meta}
              </p>
              <p className="mt-3 text-sm text-slate-300">
                {program.summary}
              </p>
              <span className="mt-4 inline-flex text-sm font-semibold text-brand-orange-300 group-hover:text-emerald-200">
                Learn more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
