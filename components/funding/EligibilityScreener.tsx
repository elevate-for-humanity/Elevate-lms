'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

type Answers = {
  indiana: '' | 'yes' | 'no';
  workone: '' | 'yes' | 'no';
  authorization: '' | 'yes' | 'no';
};

const TOTAL_STEPS = 3;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6" aria-hidden="true">
      <div
        className="bg-brand-red-600 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  );
}

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
        selected
          ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-700'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-3">
        <span
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-brand-red-600 bg-brand-red-600' : 'border-slate-300'}`}
          aria-hidden="true"
        >
          {selected && <CheckCircle className="w-3 h-3 text-white" />}
        </span>
        {label}
      </span>
    </button>
  );
}

export default function EligibilityScreener({ program }: { program?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({
    indiana: '',
    workone: '',
    authorization: '',
  });

  function set<K extends keyof Answers>(field: K, value: Answers[K]) {
    setAnswers((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  function back() {
    setStep((current) => Math.max(current - 1, 1));
  }

  function continueToApplication() {
    const query = new URLSearchParams();
    if (program) query.set('program', program);
    // Deliberately do not transmit `qualified`, an inferred funding source, or
    // other approval-like state. The responsible agency and the verified
    // authorization workflow are the only authorities for funding status.
    const suffix = query.toString();
    router.push(`/apply/student${suffix ? `?${suffix}` : ''}`);
  }

  const canAdvance: Record<number, boolean> = {
    1: answers.indiana !== '',
    2: answers.workone !== '',
    3: answers.authorization !== '',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Preliminary funding preparation only.</strong> This tool does not determine
            WIOA, Workforce Ready Grant, JRI, or other funding eligibility and does not issue an
            award. WorkOne or the responsible agency makes that decision.
          </p>
        </div>
      </div>

      <div className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Step {step} of {TOTAL_STEPS}
      </div>
      <ProgressBar step={step} />

      {step === 1 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Do you currently live in Indiana?</h2>
          <p className="text-slate-500 text-sm mb-5">
            Some Indiana workforce programs have residency requirements. Residency alone does not establish eligibility.
          </p>
          <div className="space-y-3">
            <OptionButton label="Yes" selected={answers.indiana === 'yes'} onClick={() => set('indiana', 'yes')} />
            <OptionButton label="No" selected={answers.indiana === 'no'} onClick={() => set('indiana', 'no')} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Have you completed or scheduled a WorkOne intake?</h2>
          <p className="text-slate-500 text-sm mb-5">
            WorkOne or the applicable funding agency must complete its own eligibility and program review.
          </p>
          <div className="space-y-3">
            <OptionButton label="Yes" selected={answers.workone === 'yes'} onClick={() => set('workone', 'yes')} />
            <OptionButton label="No / not yet" selected={answers.workone === 'no'} onClick={() => set('workone', 'no')} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Do you already have written funding authorization for this training?</h2>
          <p className="text-slate-500 text-sm mb-5">
            A verbal discussion, provider listing, or website result is not written funding authorization.
          </p>
          <div className="space-y-3">
            <OptionButton label="Yes, I have written authorization" selected={answers.authorization === 'yes'} onClick={() => set('authorization', 'yes')} />
            <OptionButton label="No / I am still in review" selected={answers.authorization === 'no'} onClick={() => set('authorization', 'no')} />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button type="button" onClick={back} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance[step]}
            className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={continueToApplication}
            disabled={!canAdvance[3]}
            className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Continue to Application <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
