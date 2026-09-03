'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleHelp, Landmark, ShieldCheck } from 'lucide-react';

const QUESTIONS = [
  'Are you seeking employment, a better job, or training for a new occupation?',
  'Would occupational training help you qualify for the work you are pursuing?',
  'Are you willing to meet with WorkOne or your local workforce agency for an eligibility determination?',
  'Can you provide the identity, residency, employment, income, or other documents the workforce agency requests?',
  'Do you understand that funding must be approved in writing before training begins?',
] as const;

type Answer = 'yes' | 'no' | null;

export default function PreliminaryEligibilityQuizPage() {
  const [answers, setAnswers] = useState<Answer[]>(QUESTIONS.map(() => null));
  const completed = answers.every((answer) => answer !== null);
  const yesCount = useMemo(() => answers.filter((answer) => answer === 'yes').length, [answers]);

  function setAnswer(index: number, value: Exclude<Answer, null>) {
    setAnswers((current) => current.map((answer, position) => (position === index ? value : answer)));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Preliminary workforce-funding screening
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Check whether a WorkOne funding conversation makes sense.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">
            This screening does not determine WIOA, Workforce Ready Grant, or other funding eligibility. Only the responsible workforce agency can make that determination and authorize funding.
          </p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p><strong>No funding is guaranteed.</strong> Program listing, provider status, or this screening does not create eligibility or a payment obligation.</p>
            </div>
          </div>

          {QUESTIONS.map((question, index) => (
            <fieldset key={question} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <legend className="flex gap-3 text-base font-bold text-slate-900">
                <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue-700" aria-hidden="true" />
                <span>{question}</span>
              </legend>
              <div className="mt-5 flex gap-3 pl-8">
                {(['yes', 'no'] as const).map((value) => {
                  const selected = answers[index] === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAnswer(index, value)}
                      className={`min-w-24 rounded-xl border px-5 py-3 text-sm font-bold transition ${selected ? 'border-brand-blue-700 bg-brand-blue-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-blue-500'}`}
                    >
                      {value === 'yes' ? 'Yes' : 'No'}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {completed && (
            <section aria-live="polite" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">Your next step is an agency eligibility review.</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    You answered yes to {yesCount} of {QUESTIONS.length} screening questions. This result is informational only. Contact WorkOne for the controlling eligibility, funding availability, documentation, and authorization decision.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href="/find-workone" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">
                      Find WorkOne <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link href="/apply/student" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-800 hover:bg-slate-50">
                      Start training application
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
