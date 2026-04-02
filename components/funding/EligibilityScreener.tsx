'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, CheckCircle, ArrowLeft } from 'lucide-react';

type Answers = {
  age: '' | '18+' | 'under18';
  employment: '' | 'unemployed' | 'part_time' | 'full_time';
  income: '' | 'low' | 'moderate' | 'high';
  justice: '' | 'yes' | 'no';
};

const TOTAL_STEPS = 4;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6">
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
      onClick={onClick}
      className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
        selected
          ? 'border-brand-red-600 bg-brand-red-50 text-brand-red-700'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-3">
        <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selected ? 'border-brand-red-600 bg-brand-red-600' : 'border-slate-300'}`}>
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
    age: '',
    employment: '',
    income: '',
    justice: '',
  });

  function set<K extends keyof Answers>(field: K, value: Answers[K]) {
    setAnswers(prev => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setStep(s => Math.max(s - 1, 1));
  }

  function evaluate() {
    // Funded pathway: 18+, not full-time employed, low/moderate income
    const fundedQualifies =
      answers.age === '18+' &&
      answers.employment !== 'full_time' &&
      (answers.income === 'low' || answers.income === 'moderate');

    // JRI pathway: justice-involved
    const jriQualifies = answers.justice === 'yes';

    // Self-pay: everyone else
    const qualified = fundedQualifies || jriQualifies ? 'true' : 'false';
    const pathway = jriQualifies ? 'jri' : fundedQualifies ? 'wioa' : 'self_pay';

    const dest = program
      ? `/apply?qualified=${qualified}&pathway=${pathway}&program=${program}`
      : `/apply?qualified=${qualified}&pathway=${pathway}`;

    router.push(dest);
  }

  const canAdvance: Record<number, boolean> = {
    1: answers.age !== '',
    2: answers.employment !== '',
    3: answers.income !== '',
    4: answers.justice !== '',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-lg mx-auto">
      <div className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Step {step} of {TOTAL_STEPS}
      </div>
      <ProgressBar step={step} />

      {step === 1 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Are you 18 or older?</h2>
          <p className="text-slate-500 text-sm mb-5">Most funded programs require participants to be 18+.</p>
          <div className="space-y-3">
            <OptionButton label="Yes, I am 18 or older" selected={answers.age === '18+'} onClick={() => set('age', '18+')} />
            <OptionButton label="No, I am under 18" selected={answers.age === 'under18'} onClick={() => set('age', 'under18')} />
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Current employment status?</h2>
          <p className="text-slate-500 text-sm mb-5">This helps determine which funding programs apply to you.</p>
          <div className="space-y-3">
            <OptionButton label="Unemployed / looking for work" selected={answers.employment === 'unemployed'} onClick={() => set('employment', 'unemployed')} />
            <OptionButton label="Part-time employed" selected={answers.employment === 'part_time'} onClick={() => set('employment', 'part_time')} />
            <OptionButton label="Full-time employed" selected={answers.employment === 'full_time'} onClick={() => set('employment', 'full_time')} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Household income level?</h2>
          <p className="text-slate-500 text-sm mb-5">WIOA and WRG funding is income-based. All answers are confidential.</p>
          <div className="space-y-3">
            <OptionButton label="Low income (below 200% federal poverty level)" selected={answers.income === 'low'} onClick={() => set('income', 'low')} />
            <OptionButton label="Moderate income" selected={answers.income === 'moderate'} onClick={() => set('income', 'moderate')} />
            <OptionButton label="Above moderate" selected={answers.income === 'high'} onClick={() => set('income', 'high')} />
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Have you been involved in the justice system?</h2>
          <p className="text-slate-500 text-sm mb-5">Job Ready Indy and JRI funding is specifically available for justice-involved individuals.</p>
          <div className="space-y-3">
            <OptionButton label="Yes" selected={answers.justice === 'yes'} onClick={() => set('justice', 'yes')} />
            <OptionButton label="No" selected={answers.justice === 'no'} onClick={() => set('justice', 'no')} />
          </div>
        </>
      )}

      <div className="flex items-center justify-between mt-6">
        {step > 1 ? (
          <button onClick={back} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <span />
        )}

        {step < TOTAL_STEPS ? (
          <button
            onClick={next}
            disabled={!canAdvance[step]}
            className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={evaluate}
            disabled={!canAdvance[4]}
            className="flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
          >
            See My Results <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
