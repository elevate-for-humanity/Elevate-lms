'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Briefcase, 
  GraduationCap,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  Truck,
  Stethoscope,
  Wrench,
  Scissors,
  Building2
} from 'lucide-react';
import Link from 'next/link';

// Program data with all attributes
const PROGRAMS = [
  {
    slug: 'barber-apprenticeship',
    title: 'Barbering',
    category: 'beauty',
    icon: <Scissors className="w-6 h-6" />,
    duration: '52 weeks',
    credential: 'Indiana Barber License',
    salary: '$35,000-$55,000/yr',
    funding: ['WIOA', 'WRG', 'JRI'],
    apprenticeship: true,
    description: 'Learn classic and modern cutting techniques, shaving, and styling while earning at a host barbershop.',
  },
  {
    slug: 'cosmetology-apprenticeship',
    title: 'Cosmetology',
    category: 'beauty',
    icon: <Sparkles className="w-6 h-6" />,
    duration: '52 weeks',
    credential: 'Indiana Cosmetology License',
    salary: '$30,000-$50,000/yr',
    funding: ['WIOA', 'WRG'],
    apprenticeship: true,
    description: 'Master hair, makeup, and nail techniques with hands-on training at partner salons.',
  },
  {
    slug: 'hvac-technician',
    title: 'HVAC/R Technician',
    category: 'trades',
    icon: <Wrench className="w-6 h-6" />,
    duration: '48 weeks',
    credential: 'EPA 608 Certification',
    salary: '$45,000-$65,000/yr',
    funding: ['WIOA', 'JRI'],
    apprenticeship: true,
    description: 'Install, repair, and maintain heating, cooling, and refrigeration systems.',
  },
  {
    slug: 'cna-medication-aide',
    title: 'CNA + Medication Aide',
    category: 'healthcare',
    icon: <Stethoscope className="w-6 h-6" />,
    duration: '16 weeks',
    credential: 'CNA License + Medication Aide',
    salary: '$30,000-$45,000/yr',
    funding: ['WIOA', 'FSSA', 'VR'],
    apprenticeship: false,
    description: 'Start your healthcare career as a Certified Nursing Assistant with medication administration skills.',
  },
  {
    slug: 'cdl-training',
    title: 'Commercial Trucking (CDL)',
    category: 'trades',
    icon: <Truck className="w-6 h-6" />,
    duration: '8 weeks',
    credential: 'CDL Class A',
    salary: '$50,000-$75,000/yr',
    funding: ['WIOA', 'VR'],
    apprenticeship: false,
    description: 'Get your commercial driver\'s license and start driving with paid training programs.',
  },
  {
    slug: 'medical-assistant',
    title: 'Medical Assistant',
    category: 'healthcare',
    icon: <HeartHandshake className="w-6 h-6" />,
    duration: '24 weeks',
    credential: 'RMA or CMA Certification',
    salary: '$35,000-$48,000/yr',
    funding: ['WIOA', 'FSSA'],
    apprenticeship: false,
    description: 'Work in medical offices helping physicians with clinical and administrative tasks.',
  },
];

// Quiz questions
const QUESTIONS = [
  {
    id: 'career_interest',
    question: 'What field interests you most?',
    options: [
      { value: 'beauty', label: 'Beauty & Personal Care', icon: <Scissors className="w-5 h-5" /> },
      { value: 'healthcare', label: 'Healthcare', icon: <Stethoscope className="w-5 h-5" /> },
      { value: 'trades', label: 'Skilled Trades', icon: <Wrench className="w-5 h-5" /> },
      { value: 'business', label: 'Business & Technology', icon: <Building2 className="w-5 h-5" /> },
    ],
  },
  {
    id: 'time_commitment',
    question: 'How much time can you commit to training per week?',
    options: [
      { value: 'full_time', label: 'Full-time (40+ hours)', description: 'Graduate faster with intensive training' },
      { value: 'part_time', label: 'Part-time (20-30 hours)', description: 'Balance training with other commitments' },
      { value: 'minimal', label: 'Just a few hours', description: 'Earn while you learn slowly' },
    ],
  },
  {
    id: 'funding_status',
    question: 'What is your current funding situation?',
    options: [
      { value: 'unemployed', label: 'Unemployed or laid off', description: 'May qualify for WIOA funding' },
      { value: 'employed_parttime', label: 'Working but want to switch careers', description: 'May qualify for funding assistance' },
      { value: 'looking', label: 'Employed and looking to advance', description: 'May qualify for employer programs' },
      { value: 'unknown', label: 'Not sure about funding', description: 'We\'ll help you check' },
    ],
  },
  {
    id: 'goal',
    question: 'What is your primary career goal?',
    options: [
      { value: 'quick_start', label: 'Start working as soon as possible', description: 'CDL and some healthcare programs are fastest' },
      { value: 'license', label: 'Get a professional license', description: 'Barber and cosmetology licenses' },
      { value: 'certification', label: 'Earn industry certifications', description: 'HVAC, medical assisting, and more' },
      { value: 'apprenticeship', label: 'Earn while I learn', description: 'Paid apprenticeship programs' },
    ],
  },
];

interface QuizState {
  career_interest: string;
  time_commitment: string;
  funding_status: string;
  goal: string;
}

function QuizQuestion({
  question,
  options,
  currentAnswer,
  onAnswer,
  onNext,
  onBack,
  isFirst,
  progress,
}: {
  question: string;
  options: { value: string; label: string; description?: string; icon?: React.ReactNode }[];
  currentAnswer: string;
  onAnswer: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  progress: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-500 mb-2">
          <span>Question {progress} of {QUESTIONS.length}</span>
          <span>{Math.round((progress / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-brand-red-600"
            initial={{ width: 0 }}
            animate={{ width: `${(progress / QUESTIONS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center">
        {question}
      </h3>

      {/* Options */}
      <div className="space-y-4">
        {options.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(option.value)}
            className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
              currentAnswer === option.value
                ? 'border-brand-red-600 bg-brand-red-50'
                : 'border-slate-200 bg-white hover:border-brand-red-300'
            }`}
          >
            <div className="flex items-center gap-4">
              {option.icon && (
                <div className={`p-3 rounded-xl ${
                  currentAnswer === option.value
                    ? 'bg-brand-red-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {option.icon}
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                )}
              </div>
              {currentAnswer === option.value && (
                <CheckCircle className="w-6 h-6 text-brand-red-600" />
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        {!isFirst ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          disabled={!currentAnswer}
          className="flex items-center gap-2 px-8 py-3 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function Results({
  quiz,
  onRestart,
}: {
  quiz: QuizState;
  onRestart: () => void;
}) {
  // Filter programs based on quiz answers
  const recommended = PROGRAMS.filter((program) => {
    if (quiz.career_interest && program.category !== quiz.career_interest) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Prioritize based on goals
    if (quiz.goal === 'quick_start' && a.duration < b.duration) return -1;
    if (quiz.goal === 'apprenticeship' && a.apprenticeship && !b.apprenticeship) return -1;
    return 0;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-brand-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-brand-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          Your Personalized Career Path
        </h2>
        <p className="text-slate-600 text-lg">
          Based on your goals, here are the programs we recommend for you.
        </p>
      </div>

      {/* Recommended Programs */}
      <div className="space-y-6 mb-10">
        {recommended.slice(0, 3).map((program, index) => (
          <motion.div
            key={program.slug}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-brand-red-100 rounded-xl text-brand-red-600">
                  {program.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{program.title}</h3>
                  <p className="text-slate-600 mb-4">{program.description}</p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{program.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span>{program.credential}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>{program.salary}</span>
                    </div>
                    {program.apprenticeship && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Briefcase className="w-4 h-4" />
                        <span>Paid Apprenticeship</span>
                      </div>
                    )}
                  </div>

                  {/* Funding badges */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {program.funding.map((f) => (
                      <span key={f} className="px-3 py-1 bg-brand-blue-100 text-brand-blue-700 text-xs font-semibold rounded-full">
                        {f} Eligible
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/programs/${program.slug}`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red-600 text-white font-semibold rounded-xl hover:bg-brand-red-700 transition-colors"
                    >
                      View Program
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/programs/${program.slug}/apply`}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-red-100 text-brand-red-700 font-semibold rounded-xl hover:bg-brand-red-200 transition-colors"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* All Programs Link */}
      <div className="text-center mb-8">
        <Link
          href="/programs"
          className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:text-brand-blue-700"
        >
          View all {PROGRAMS.length} programs
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Funding Check CTA */}
      <div className="bg-slate-900 rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold text-white mb-4">
          Not sure about funding?
        </h3>
        <p className="text-slate-300 mb-6">
          Most students qualify for WIOA or other workforce funding that covers their training.
        </p>
        <Link
          href="/eligibility"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-red-600 text-white font-bold rounded-xl hover:bg-brand-red-700 transition-colors"
        >
          Check Your Eligibility — Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Restart */}
      <div className="text-center mt-8">
        <button
          onClick={onRestart}
          className="text-slate-500 hover:text-slate-700 font-medium"
        >
          Start over
        </button>
      </div>
    </motion.div>
  );
}

export function ProgramDiscovery() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QuizState>({
    career_interest: '',
    time_commitment: '',
    funding_status: '',
    goal: '',
  });
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];
  const progress = currentStep + 1;

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({
      career_interest: '',
      time_commitment: '',
      funding_status: '',
      goal: '',
    });
    setShowResults(false);
  };

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-brand-red-600 font-bold text-sm uppercase tracking-widest">
            AI-Powered Career Matching
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 mb-4">
            Find Your Perfect Program
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Answer a few questions and we'll recommend the programs that best match your 
            goals, schedule, and funding eligibility.
          </p>
        </div>

        {/* Quiz Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-12">
          <AnimatePresence mode="wait">
            {showResults ? (
              <Results quiz={answers} onRestart={handleRestart} />
            ) : (
              <QuizQuestion
                key={currentQuestion.id}
                question={currentQuestion.question}
                options={currentQuestion.options}
                currentAnswer={answers[currentQuestion.id as keyof QuizState]}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onBack={handleBack}
                isFirst={currentStep === 0}
                progress={progress}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 mt-10 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Free to use</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Takes 2 minutes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>No personal info required</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProgramDiscovery;
