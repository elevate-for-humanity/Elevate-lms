'use client';

import type { ProgramSchema } from '@/lib/programs/program-schema';

/** Training → Credential → Employer → Job → Wage — workforce board mental model. */
export default function ProgramEmploymentPathway({ program }: { program: ProgramSchema }) {
  const credential = program.credentials[0];
  const entryJob = program.careers?.[0];
  const employer = program.employerPartners?.[0];

  const steps = [
    {
      label: 'Training',
      value: `${program.durationWeeks} weeks · ${program.schedule}`,
    },
    {
      label: 'Credential',
      value: credential
        ? `${credential.name} (${credential.issuingBody ?? credential.issuer})`
        : 'Industry credential upon completion',
    },
    {
      label: 'Experience',
      value:
        program.programType === 'apprenticeship'
          ? 'Paid on-the-job training with employer host'
          : program.deliveryMode === 'hybrid'
            ? 'Hands-on lab and/or clinical or work-based practice'
            : 'Skills practice aligned to credential exam',
    },
    {
      label: 'Employer pathway',
      value: employer
        ? `Introductions to partners including ${employer}`
        : 'Placement support through employer network',
    },
    {
      label: 'Entry role & wage',
      value: entryJob
        ? `${entryJob.title} · ${entryJob.salary}`
        : program.laborMarket?.salaryRange
          ? `Typical range ${program.laborMarket.salaryRange}`
          : 'Regional entry wages — see labor market data',
    },
    {
      label: 'Advancement',
      value: program.careerPathway?.[1]?.title
        ? `${program.careerPathway[1].title} (${program.careerPathway[1].salaryRange})`
        : 'Documented career ladder in program pathway section',
    },
  ];

  return (
    <section className="py-12 bg-white border-b border-slate-100" aria-labelledby="employment-pathway-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 id="employment-pathway-heading" className="text-2xl font-extrabold text-slate-900 mb-2">
          Training to Employment Pathway
        </h2>
        <p className="text-slate-600 text-sm mb-8 max-w-2xl">
          How this program connects instruction, credentialing, employers, and wages — the sequence
          workforce boards use to evaluate programs.
        </p>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <li
              key={step.label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 list-none"
            >
              <p className="text-[10px] font-bold text-brand-red-600 uppercase tracking-widest mb-1">
                Step {index + 1} · {step.label}
              </p>
              <p className="text-sm font-semibold text-slate-900 leading-snug">{step.value}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-slate-500">
          Employment is not guaranteed. Outcomes depend on individual performance, credential
          attainment, and local labor market conditions.
        </p>
      </div>
    </section>
  );
}
