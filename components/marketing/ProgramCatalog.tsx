// components/marketing/ProgramCatalog.tsx
import Link from 'next/link';

const paths = ['Healthcare', 'Skilled Trades', 'CDL', 'Barber', 'Re-entry'];

const programs = [
  {
    name: 'Medical Assistant',
    summary:
      'Clinical skills, patient interaction, and hands-on training for clinics, hospitals, and specialty practices.',
    meta: '~5 months · Healthcare',
    href: '/programs/medical-assistant',
    applyHref: '/apply?program=medical-assistant',
    funding: 'WIOA / WRG Eligible',
    price: null,
  },
  {
    name: 'Barber Apprenticeship',
    summary:
      'Earn while you learn in real barbershops while stacking hours toward licensure and long-term income.',
    meta: 'Hours-based · Barber',
    href: '/programs/barber-apprenticeship',
    applyHref: '/programs/barber-apprenticeship/apply',
    funding: 'Fee-Based · $4,980',
    price: '$4,980',
  },
  {
    name: 'HVAC Technician',
    summary:
      'Heating, cooling, and refrigeration training to step into in-demand skilled trades roles.',
    meta: '12 weeks · Skilled Trades',
    href: '/programs/hvac-technician',
    applyHref: '/programs/hvac-technician/apply',
    funding: 'WIOA / WRG Eligible',
    price: null,
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
            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
              Training that leads to real employment.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Every pathway is built with an employer or workforce need behind it. No random classes
              — just programs that connect to real roles, apprenticeships, and income.
            </p>
          </div>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white hover:border-brand-red-300 hover:bg-slate-900"
          >
            View full program directory →
          </Link>
        </header>

        {/* Category chips */}
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {paths.map((path) => (
            <span
              key={path}
              className="rounded-full bg-slate-900 px-3 py-2 text-white ring-1 ring-slate-700"
            >
              {path}
            </span>
          ))}
        </div>

        {/* Program cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <div
              key={program.name}
              className="flex flex-col rounded-3xl bg-slate-900/80 p-5 ring-1 ring-slate-800"
            >
              <h3 className="text-base font-semibold text-white">{program.name}</h3>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {program.meta}
              </p>
              <p className="mt-1 text-xs font-semibold text-brand-green-400">{program.funding}</p>
              <p className="mt-3 text-sm text-slate-400 flex-1">{program.summary}</p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={program.applyHref}
                  className="inline-flex items-center justify-center bg-brand-red-600 hover:bg-brand-red-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors"
                >
                  {program.price ? `Enroll · ${program.price}` : 'Apply Now — Free'}
                </Link>
                <Link
                  href={program.href}
                  className="inline-flex items-center justify-center border border-slate-700 hover:border-slate-500 text-slate-300 px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
                >
                  View Program →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
