'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  DollarSign,
  MapPin,
  RotateCcw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface QuizOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  image?: string;
  description?: string;
}

interface QuizStep {
  question: string;
  subtitle: string;
  options: QuizOption[];
  key: string;
}

const steps: QuizStep[] = [
  {
    key: 'interest',
    question: 'What kind of work excites you?',
    subtitle: 'Pick the field that feels right — you can always explore others later.',
    options: [
      { id: 'healthcare', label: 'Healthcare', image: '/images/hero/hero-healthcare.jpg', description: 'Help people heal and stay healthy' },
      { id: 'trades', label: 'Skilled Trades', image: '/images/trades/hero-program-hvac.jpg', description: 'Build, fix, and create with your hands' },
      { id: 'cdl', label: 'CDL / Trucking', image: '/images/cdl-vibrant.jpg', description: 'Hit the road and earn $50K+' },
      { id: 'tech', label: 'Technology', image: '/images/programs-hq/it-support.jpg', description: 'IT support, cybersecurity, web dev' },
      { id: 'barber', label: 'Barbering', image: '/images/barber-hero-new.jpg', description: 'Earn while you learn a creative trade' },
      { id: 'safety', label: 'CPR & First Aid', image: '/images/programs-hq/healthcare-hero.jpg', description: 'Same-day HSI certification' },
    ],
  },
  {
    key: 'timeline',
    question: 'How soon do you want to start?',
    subtitle: 'Most programs have rolling enrollment — no waiting for a semester.',
    options: [
      { id: 'asap', label: 'This week', icon: <Clock className="w-6 h-6" />, description: 'I\'m ready now' },
      { id: 'month', label: 'Within a month', icon: <Clock className="w-6 h-6" />, description: 'Need a little time to prepare' },
      { id: 'exploring', label: 'Just exploring', icon: <Clock className="w-6 h-6" />, description: 'Researching my options' },
    ],
  },
  {
    key: 'funding',
    question: 'Do you need help paying for training?',
    subtitle: 'Many students qualify for no-cost training through state and federal programs.',
    options: [
      { id: 'free', label: 'Yes — I need free training', icon: <DollarSign className="w-6 h-6" />, description: 'WIOA, WRG, and JRI cover everything' },
      { id: 'self', label: 'I can pay on my own', icon: <DollarSign className="w-6 h-6" />, description: 'Self-pay or employer-sponsored' },
      { id: 'unsure', label: 'Not sure yet', icon: <DollarSign className="w-6 h-6" />, description: 'Help me figure it out' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Result mapping                                                     */
/* ------------------------------------------------------------------ */

interface ProgramResult {
  title: string;
  description: string;
  href: string;
  duration: string;
  salary: string;
  funding: string;
}

const programResults: Record<string, ProgramResult[]> = {
  healthcare: [
    { title: 'CNA Certification', description: 'Become a Certified Nursing Assistant in 4-6 weeks. High demand across Indiana hospitals and care facilities.', href: '/programs/cna', duration: '4-6 weeks', salary: '$32K-$42K', funding: 'WIOA / WRG' },
    { title: 'Medical Assistant', description: 'Clinical and administrative skills for doctor\'s offices, clinics, and hospitals.', href: '/programs/medical-assistant', duration: '12-16 weeks', salary: '$35K-$45K', funding: 'WIOA / WRG' },
    { title: 'Phlebotomy', description: 'Learn venipuncture and specimen collection. Quick certification, immediate job placement.', href: '/programs/healthcare', duration: '4-8 weeks', salary: '$33K-$40K', funding: 'WIOA / WRG' },
  ],
  trades: [
    { title: 'HVAC Technician', description: 'Install and repair heating, ventilation, and air conditioning systems.', href: '/programs/hvac-technician', duration: '8-16 weeks', salary: '$40K-$65K', funding: 'WIOA / WRG' },
    { title: 'Electrical', description: 'Residential and commercial electrical installation and maintenance.', href: '/programs/electrical', duration: '8-16 weeks', salary: '$42K-$70K', funding: 'WIOA / WRG' },
    { title: 'Welding', description: 'MIG, TIG, and stick welding certifications for manufacturing and construction.', href: '/programs/welding', duration: '8-12 weeks', salary: '$38K-$60K', funding: 'WIOA / WRG' },
  ],
  cdl: [
    { title: 'CDL Class A Training', description: 'Get your Commercial Driver\'s License and start earning immediately. Over-the-road and local routes available.', href: '/programs/cdl-training', duration: '3-4 weeks', salary: '$50K-$80K', funding: 'WIOA / WRG' },
  ],
  tech: [
    { title: 'IT Help Desk', description: 'Certiport IT Specialist certification. Help desk and system administration roles.', href: '/programs/it-help-desk', duration: '8 weeks', salary: '$38K-$55K', funding: 'WIOA / WRG' },
    { title: 'Cybersecurity Analyst', description: 'Certiport IT Specialist — Cybersecurity certification. Protect networks and data for organizations.', href: '/programs/cybersecurity-analyst', duration: '12 weeks', salary: '$55K-$100K', funding: 'WIOA / WRG' },
  ],
  barber: [
    { title: 'Barber Apprenticeship', description: 'Earn while you learn in a licensed barbershop. 1,500 hours toward your Indiana barber license.', href: '/programs/barber-apprenticeship', duration: '12-18 months', salary: '$30K-$60K+', funding: 'JRI / WIOA' },
  ],
  safety: [
    { title: 'CPR & First Aid (HSI)', description: 'Same-day certification. American Heart Association equivalent through HSI.', href: '/programs/cpr-first-aid', duration: '1 day', salary: 'Required for many jobs', funding: 'Self-pay ($65)' },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProgramFinderQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const showResults = currentStep >= steps.length;

  const selectOption = useCallback((optionId: string) => {
    setSelectedOption(optionId);

    // Auto-advance after a brief pause so the user sees their selection
    setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setAnswers((prev) => ({ ...prev, [step.key]: optionId }));
        setCurrentStep((prev) => prev + 1);
        setSelectedOption(null);
        setIsTransitioning(false);
      }, 300);
    }, 400);
  }, [step]);

  const goBack = () => {
    if (currentStep > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep((prev) => prev - 1);
        setSelectedOption(null);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const restart = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers({});
      setSelectedOption(null);
      setIsTransitioning(false);
    }, 200);
  };

  const results = programResults[answers.interest] || [];

  /* ---- Results screen ---- */
  if (showResults) {
    return (
      <div className={`transition-all duration-500 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Your personalized results
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Programs matched to you
          </h3>
          <p className="text-slate-600 mt-2">
            Based on your interest in <span className="font-semibold text-slate-900">{answers.interest}</span>
            {answers.funding === 'free' && ' — these programs are available at no cost'}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 max-w-3xl mx-auto">
          {results.map((program, i) => (
            <Link
              key={program.href}
              href={program.href}
              className="group relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 hover:border-brand-blue-300 hover:shadow-lg hover:shadow-brand-blue-500/5 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-brand-blue-600 transition-colors">
                    {program.title}
                  </h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">{program.description}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" /> {program.duration}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full">
                      <DollarSign className="w-3.5 h-3.5" /> {program.salary}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5" /> {program.funding}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-600 group-hover:gap-2 transition-all">
                    View program <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Start over
          </button>
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Browse all programs <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  /* ---- Quiz steps ---- */
  const progress = ((currentStep) / steps.length) * 100;

  return (
    <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          {currentStep > 0 && (
            <button onClick={goBack} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{step.question}</h3>
        <p className="text-slate-500 mt-2">{step.subtitle}</p>
      </div>

      {/* Options */}
      {step.options.some((o) => o.image) ? (
        /* ---- Image tile layout (step 1) ---- */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {step.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => selectOption(option.id)}
                className={`
                  group relative rounded-2xl overflow-hidden cursor-pointer
                  transition-all duration-300
                  ${isSelected
                    ? 'ring-4 ring-brand-blue-500 ring-offset-2 scale-[1.02]'
                    : 'hover:shadow-xl hover:-translate-y-1'
                  }
                `}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={option.image!}
                    alt={option.label}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <p className="font-bold text-white text-lg leading-tight">{option.label}</p>
                  {option.description && (
                    <p className="text-white/70 text-sm mt-0.5">{option.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-brand-blue-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* ---- Icon card layout (steps 2-3) ---- */
        <div className={`grid gap-3 ${step.options.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 max-w-xl mx-auto'}`}>
          {step.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => selectOption(option.id)}
                className={`
                  relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 text-center
                  transition-all duration-200 cursor-pointer
                  ${isSelected
                    ? 'border-brand-blue-500 bg-brand-blue-50 shadow-md shadow-brand-blue-500/10 scale-[1.02]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50 hover:-translate-y-0.5'
                  }
                `}
              >
                {option.icon && (
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200
                    ${isSelected ? 'bg-brand-blue-500 text-white' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {option.icon}
                  </div>
                )}
                <div>
                  <p className={`font-semibold text-base ${isSelected ? 'text-brand-blue-700' : 'text-slate-900'}`}>
                    {option.label}
                  </p>
                  {option.description && (
                    <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
                  )}
                </div>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-brand-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
