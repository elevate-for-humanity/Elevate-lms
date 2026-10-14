'use client';
import { useState } from 'react';
import Link from 'next/link';
import { TaxSiteShell, taxButton } from '../_components/TaxSiteShell';
const steps = [
  {
    title: 'Confirm your information',
    description:
      'Start with the correct tax year and taxpayer record. Review household and dependent information before moving to income.',
    review: 'Check names, filing status, dependents and the tax year against your actual records.',
  },
  {
    title: 'Add income documents',
    description:
      'Gather W-2s, applicable 1099s and business records. For supported document uploads, confirm extracted values against the original.',
    review:
      'Missing or unclear information needs clarification. Do not invent an amount or count the same income twice.',
  },
  {
    title: 'Review the preparation',
    description:
      'Review entered information, estimates, document totals and identified preparation issues. A changed source document needs another review.',
    review:
      'A saved worksheet or estimate is preparation progress. It is not an IRS acceptance acknowledgment.',
  },
  {
    title: 'Understand the price',
    description:
      'Review the preparation quote and any applicable form or service charges. Ask the team which payment options are available for your situation.',
    review:
      'A Refund Transfer and a refund advance are different products. Any bank option requires its own current terms, eligibility and agreements.',
  },
  {
    title: 'Arrange final filing steps',
    description:
      'Resolve outstanding questions with the preparer, review the actual return, and complete the required authorizations through the approved filing process.',
    review:
      'Electronic submission and bank processing are not active in this online workspace. Contact the team about your final filing arrangements.',
  },
];
export default function SoftwareDemo() {
  const [step, setStep] = useState(0);
  return (
    <TaxSiteShell>
      <main>
        <section className="bg-[#082b66] px-6 py-14 !text-white sm:px-10 lg:px-14">
          <p className="text-xs font-extrabold uppercase tracking-widest !text-white">
            Preparation walkthrough
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight !text-white sm:text-5xl">
            See the steps before you start.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 !text-white">
            Explore the preparation workflow without entering personal information. This is an
            illustrated walkthrough; it does not create, file or transmit a return.
          </p>
        </section>
        <section className="px-6 py-12 sm:px-10 lg:px-14">
          <div className="grid gap-7 lg:grid-cols-[280px_1fr]">
            <nav
              aria-label="Preparation walkthrough steps"
              className="self-start rounded-2xl border border-slate-200 p-4"
            >
              <p className="px-3 pb-3 text-xs font-bold uppercase tracking-widest text-[#073ca2]">
                Choose a step
              </p>
              {steps.map((s, i) => (
                <button
                  type="button"
                  key={s.title}
                  onClick={() => setStep(i)}
                  aria-current={i === step ? 'step' : undefined}
                  className={
                    'mb-2 flex min-h-12 w-full gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold ' +
                    (i === step ? 'bg-[#082b66] !text-white' : 'hover:bg-blue-50')
                  }
                >
                  <span>0{i + 1}</span>
                  {s.title}
                </button>
              ))}
            </nav>
            <div className="rounded-2xl border border-slate-200 p-7 sm:p-9" aria-live="polite">
              <p className="text-sm font-bold text-[#c8102e]">
                STEP {step + 1} OF {steps.length}
              </p>
              <h2 className="mt-4 text-3xl font-black">{steps[step].title}</h2>
              <p className="mt-5 text-lg leading-8 text-slate-700">{steps[step].description}</p>
              <div className="mt-7 border-l-4 border-[#073ca2] bg-[#f0f5ff] p-5">
                <h3 className="font-bold">What to check</h3>
                <p className="mt-3 text-sm leading-8 text-slate-700">{steps[step].review}</p>
              </div>
              <div className="mt-8 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                  className={taxButton + ' border border-slate-300 disabled:opacity-40'}
                >
                  ← Previous
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(step + 1)}
                    className={taxButton + ' bg-[#082b66] !text-white'}
                  >
                    Next step →
                  </button>
                ) : (
                  <Link
                    href="/tax-software/contact"
                    className={taxButton + ' bg-[#c8102e] !text-white'}
                  >
                    Discuss my next step →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-6 mb-14 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-slate-50 p-8 sm:mx-10 lg:mx-14">
          <div>
            <h2 className="text-2xl font-black">Ready to work on your own information?</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Open the guided workspace, or ask a professional for help.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/tax-software/self-file"
              className={taxButton + ' bg-[#082b66] !text-white'}
            >
              Open my workspace →
            </Link>
            <Link
              href="/tax-software/contact"
              className={taxButton + ' border border-[#082b66] !text-[#082b66]'}
            >
              Get tax help
            </Link>
          </div>
        </section>
      </main>
    </TaxSiteShell>
  );
}
