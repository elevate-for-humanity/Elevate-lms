'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, GraduationCap, HelpCircle, Store, X } from 'lucide-react';

const PATHS = [
  {
    title: 'I want career training',
    text: 'Compare programs, duration, credentials, funding pathways, and payment options before applying.',
    href: '/programs',
    action: 'Compare programs',
    icon: GraduationCap,
  },
  {
    title: 'I want an apprenticeship',
    text: 'See how paid, supervised workplace learning works and what you need to start.',
    href: '/barber-and-beauty-apprenticeships',
    action: 'Explore apprenticeships',
    icon: BriefcaseBusiness,
  },
  {
    title: 'I own a shop or salon',
    text: 'Host an apprentice at no cost and get support with onboarding, records, and program administration.',
    href: '/partners/host-shops',
    action: 'See benefits and sign up free',
    icon: Store,
  },
] as const;

const ANSWERS = [
  [
    'How much does training cost?',
    'Each program page shows its current price and available payment choices. Eligible applicants may also pursue workforce funding; approval is determined by the responsible agency.',
  ],
  [
    'Can I make payments?',
    'Where offered, the program page explains deposits, installment choices, and buy-now-pay-later options before checkout.',
  ],
  [
    'What happens after I apply?',
    'Your application is reviewed, eligibility or payment steps are confirmed, required documents are collected, and you receive the correct enrollment or onboarding instructions.',
  ],
  [
    'Do I need to call first?',
    'No. You can compare the pathway, review requirements, and begin the correct application online. Contact support only when your situation needs individual help.',
  ],
] as const;

export function WebsiteGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-[79] inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-extrabold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-blue-800 sm:bottom-6 sm:right-6"
        aria-expanded={open}
        aria-controls="website-guide-panel"
      >
        <HelpCircle className="h-5 w-5" aria-hidden="true" /> Find my next step
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45 p-0 backdrop-blur-sm sm:p-4"
          role="presentation"
          onMouseDown={() => setOpen(false)}
        >
          <aside
            id="website-guide-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="website-guide-title"
            className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-red-700">
                  Elevate self-service guide
                </p>
                <h2
                  id="website-guide-title"
                  className="mt-2 text-3xl font-black tracking-tight text-slate-950"
                >
                  Choose your goal. We’ll show the next step.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close guide"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-7 space-y-3">
              {PATHS.map((path) => {
                const Icon = path.icon;
                return (
                  <Link
                    key={path.title}
                    href={path.href}
                    onClick={() => setOpen(false)}
                    className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-lg"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-lg font-black text-slate-950">
                          {path.title}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">
                          {path.text}
                        </span>
                        <span className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-brand-red-700">
                          {path.action}{' '}
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h3 className="text-xl font-black text-slate-950">
                Questions people usually ask before starting
              </h3>
              <div className="mt-4 divide-y divide-slate-200 rounded-2xl border border-slate-200">
                {ANSWERS.map(([question, answer]) => (
                  <details key={question} className="group p-4 open:bg-slate-50">
                    <summary className="cursor-pointer list-none pr-6 font-bold text-slate-950">
                      {question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{answer}</p>
                  </details>
                ))}
              </div>
            </div>

            <Link
              href="/apply"
              onClick={() => setOpen(false)}
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3.5 text-base font-extrabold text-white hover:bg-brand-red-700"
            >
              Start an application <ArrowRight className="h-5 w-5" />
            </Link>
          </aside>
        </div>
      ) : null}
    </>
  );
}
