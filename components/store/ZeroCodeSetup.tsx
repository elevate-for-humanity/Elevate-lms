'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronLeft, Sparkles, WandSparkles } from 'lucide-react';

export type ZeroCodeChoice = {
  label: string;
  value: string;
  description?: string;
};

export type ZeroCodeQuestion = {
  id: string;
  prompt: string;
  helper?: string;
  choices?: ZeroCodeChoice[];
  placeholder?: string;
};

interface ZeroCodeSetupProps {
  productName: string;
  intro: string;
  questions: ZeroCodeQuestion[];
  startHref: string;
  trialHref?: string;
  advancedNote?: string;
}

export default function ZeroCodeSetup({
  productName,
  intro,
  questions,
  startHref,
  trialHref,
  advancedNote,
}: ZeroCodeSetupProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const current = questions[step];
  const complete = step >= questions.length;

  const setupHref = useMemo(() => {
    const params = new URLSearchParams({ setup: 'guided', source: 'store' });
    Object.entries(answers).forEach(([key, value]) => {
      if (value.trim()) params.set(key, value.trim());
    });
    return `${startHref}${startHref.includes('?') ? '&' : '?'}${params.toString()}`;
  }, [answers, startHref]);

  const answerCurrent = (value: string) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const next = () => {
    if (!current) return;
    if (!answers[current.id]?.trim()) return;
    setStep((value) => value + 1);
  };

  const reset = () => {
    setAnswers({});
    setStep(0);
  };

  return (
    <section className="px-4 py-16" aria-label={`${productName} zero-code setup`}>
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-10">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
              <WandSparkles className="h-4 w-4" /> Zero-code guided setup
            </span>
            <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Tell Elevate what you want. We configure the starting point.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
            <div className="mt-8 space-y-3 text-sm text-slate-700">
              {['Answer in plain English', 'Review the recommended setup', 'Open a configured starting workspace', 'Keep advanced controls optional'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {advancedNote ? (
              <div className="mt-8 rounded-2xl bg-slate-950 p-5 text-sm leading-6 text-slate-300">
                <strong className="text-white">Advanced Mode:</strong> {advancedNote}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white md:p-8">
            {!complete && current ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-black uppercase tracking-[.18em] text-brand-red-300">
                    Question {step + 1} of {questions.length}
                  </p>
                  <span className="text-xs font-bold text-slate-400">{productName}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-brand-red-500 transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
                </div>
                <h3 className="mt-7 text-2xl font-black">{current.prompt}</h3>
                {current.helper ? <p className="mt-2 text-sm leading-6 text-slate-300">{current.helper}</p> : null}

                {current.choices?.length ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {current.choices.map((choice) => {
                      const selected = answers[current.id] === choice.value;
                      return (
                        <button
                          key={choice.value}
                          type="button"
                          onClick={() => answerCurrent(choice.value)}
                          className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-brand-red-400 bg-brand-red-500/15' : 'border-white/15 bg-white/5 hover:bg-white/10'}`}
                        >
                          <span className="font-black">{choice.label}</span>
                          {choice.description ? <span className="mt-1 block text-xs leading-5 text-slate-300">{choice.description}</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[current.id] || ''}
                    onChange={(event) => answerCurrent(event.target.value)}
                    placeholder={current.placeholder || 'Describe what you want in plain English...'}
                    rows={5}
                    className="mt-6 w-full rounded-2xl border border-white/15 bg-white p-4 text-slate-950 outline-none ring-brand-red-500 focus:ring-2"
                  />
                )}

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button type="button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))} className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-30">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button type="button" disabled={!answers[current.id]?.trim()} onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black hover:bg-brand-red-500 disabled:cursor-not-allowed disabled:opacity-40">
                    Continue <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4">
                <Sparkles className="h-9 w-9 text-brand-red-300" />
                <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-brand-red-300">Your guided setup is ready</p>
                <h3 className="mt-3 text-3xl font-black">Open {productName} with your answers attached.</h3>
                <p className="mt-4 leading-7 text-slate-300">
                  Elevate will carry this setup context into the product instead of making you start from a blank screen. Review before publishing or activating anything.
                </p>
                <div className="mt-7 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                  {questions.map((question) => (
                    <div key={question.id} className="text-sm">
                      <span className="font-bold text-slate-400">{question.prompt}</span>
                      <span className="mt-1 block text-white">{answers[question.id]}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href={setupHref} className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-black hover:bg-brand-red-500">
                    Open guided workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                  {trialHref ? <Link href={trialHref} className="rounded-xl border border-white/20 px-5 py-3 font-black hover:bg-white/10">Start free trial</Link> : null}
                  <button type="button" onClick={reset} className="rounded-xl px-4 py-3 font-bold text-slate-300 hover:bg-white/10">Start over</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
