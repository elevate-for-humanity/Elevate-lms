'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, GraduationCap, Briefcase } from 'lucide-react';

interface Step {
  id: string;
  question: string;
  description: string;
  icon: any;
  options: { label: string; value: string; qualifies: boolean }[];
}

const STEPS: Step[] = [
  {
    id: 'age',
    question: 'How old are you?',
    description: 'WIOA Adult and Dislocated Worker programs have age requirements.',
    icon: Clock,
    options: [
      { label: '18 or older', value: '18+', qualifies: true },
      { label: '16–17', value: '16-17', qualifies: true },
      { label: 'Under 16', value: '<16', qualifies: false },
    ],
  },
  {
    id: 'employment',
    question: 'What is your current employment status?',
    description: 'This helps determine which funding programs you qualify for.',
    icon: Briefcase,
    options: [
      { label: 'Unemployed', value: 'unemployed', qualifies: true },
      { label: 'Underemployed (part-time or low wage)', value: 'underemployed', qualifies: true },
      { label: 'Employed full-time', value: 'employed', qualifies: true },
      { label: 'Recently laid off', value: 'dislocated', qualifies: true },
    ],
  },
  {
    id: 'income',
    question: 'Is your household income below $40,000/year?',
    description: 'Low-income individuals qualify for additional funding sources.',
    icon: DollarSign,
    options: [
      { label: 'Yes, below $40K', value: 'low', qualifies: true },
      { label: 'No, above $40K', value: 'above', qualifies: true },
      { label: 'I\'m not sure', value: 'unsure', qualifies: true },
    ],
  },
  {
    id: 'interest',
    question: 'What career field interests you?',
    description: 'We\'ll match you with the right program and funding.',
    icon: GraduationCap,
    options: [
      { label: 'Healthcare (CNA, Medical Assistant, Phlebotomy)', value: 'healthcare', qualifies: true },
      { label: 'Skilled Trades (HVAC, Electrical, Welding, Plumbing)', value: 'trades', qualifies: true },
      { label: 'CDL / Trucking', value: 'cdl', qualifies: true },
      { label: 'Technology (IT Support, Cybersecurity)', value: 'technology', qualifies: true },
      { label: 'Barbering / Cosmetology', value: 'barber', qualifies: true },
      { label: 'Not sure yet', value: 'unsure', qualifies: true },
    ],
  },
];

export default function EligibilityPreQualifier() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [complete, setComplete] = useState(false);

  const step = STEPS[currentStep];
  const progress = ((currentStep) / STEPS.length) * 100;
  const progressAfter = ((currentStep + 1) / STEPS.length) * 100;

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [step.id]: value };
    setAnswers(newAnswers);

    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      setTimeout(() => setComplete(true), 300);
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Determine likely funding
  const getFundingMatch = () => {
    const sources: string[] = [];
    if (answers.employment === 'unemployed' || answers.employment === 'dislocated') {
      sources.push('WIOA Adult/Dislocated Worker');
    }
    if (answers.income === 'low') {
      sources.push('Workforce Ready Grant');
    }
    if (answers.age === '16-17') {
      sources.push('WIOA Youth');
    }
    sources.push('Next Level Jobs');
    if (answers.interest === 'barber') {
      sources.push('JRI Apprenticeship');
    }
    return sources;
  };

  if (complete) {
    const funding = getFundingMatch();
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
          You likely qualify for funding.
        </h2>
        <p className="text-lg text-slate-600 mb-8">
          Based on your answers, you may be eligible for {funding.length} funding source{funding.length > 1 ? 's' : ''}:
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left">
          {funding.map((source, i) => (
            <div key={i} className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium text-slate-900">{source}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-500 mb-8">
          Final eligibility is determined by your local WorkOne office. We help you through the process.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/apply/student"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-10 py-5 rounded-2xl hover:bg-slate-800 transition-all text-lg"
          >
            Start Your Application
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/programs"
            className="inline-flex items-center justify-center gap-2 border-2 border-slate-300 text-slate-700 font-semibold px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all text-lg"
          >
            Browse Programs First
          </Link>
        </div>
      </div>
    );
  }

  const Icon = step.icon;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <span className="text-sm font-bold text-slate-900">
            {Math.round(progressAfter)}% complete
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-brand-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressAfter}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-7 h-7 text-brand-blue-600" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
          {step.question}
        </h2>
        <p className="text-slate-500">{step.description}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-8">
        {step.options.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all hover:border-brand-blue-400 hover:shadow-md hover:-translate-y-0.5 ${
              answers[step.id] === option.value
                ? 'border-brand-blue-500 bg-brand-blue-50 shadow-md'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="font-semibold text-slate-900">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Back button */}
      {currentStep > 0 && (
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
    </div>
  );
}
