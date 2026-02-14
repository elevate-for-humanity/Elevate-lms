"use client";

import React from 'react';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Wrench, Scissors, Truck, Stethoscope, Code,
  ChevronRight, ChevronLeft, CheckCircle, Clock, DollarSign,
  TrendingUp, Award, ArrowRight, Sparkles
} from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: Option[];
}

interface Option {
  id: string;
  text: string;
  icon: any;
  value: string;
}

interface Program {
  id: string;
  name: string;
  description: string;
  duration: string;
  salary: string;
  demand: string;
  icon: any;
  matchScore: number;
  path: string;
}

const questions: Question[] = [
  {
    id: 1,
    question: 'What interests you most?',
    options: [
      { id: '1a', text: 'Helping people & healthcare', icon: Heart, value: 'healthcare' },
      { id: '1b', text: 'Working with my hands', icon: Wrench, value: 'trades' },
      { id: '1c', text: 'Beauty & personal care', icon: Scissors, value: 'beauty' },
      { id: '1d', text: 'Driving & transportation', icon: Truck, value: 'transportation' },
      { id: '1e', text: 'Technology & computers', icon: Code, value: 'technology' }
    ]
  },
  {
    id: 2,
    question: 'How quickly do you want to start working?',
    options: [
      { id: '2a', text: 'As soon as possible (4-8 weeks)', icon: Clock, value: 'fast' },
      { id: '2b', text: 'Within 3 months', icon: Clock, value: 'medium' },
      { id: '2c', text: 'I can take my time (6+ months)', icon: Clock, value: 'slow' }
    ]
  },
  {
    id: 3,
    question: 'What\'s your primary goal?',
    options: [
      { id: '3a', text: 'Get a job quickly', icon: TrendingUp, value: 'employment' },
      { id: '3b', text: 'Increase my income', icon: DollarSign, value: 'income' },
      { id: '3c', text: 'Start a new career', icon: Award, value: 'career' },
      { id: '3d', text: 'Gain certifications', icon: CheckCircle, value: 'certification' }
    ]
  },
  {
    id: 4,
    question: 'What\'s your experience level?',
    options: [
      { id: '4a', text: 'Complete beginner', icon: Sparkles, value: 'beginner' },
      { id: '4b', text: 'Some related experience', icon: Award, value: 'intermediate' },
      { id: '4c', text: 'Looking to advance', icon: TrendingUp, value: 'advanced' }
    ]
  },
  {
    id: 5,
    question: 'What schedule works best for you?',
    options: [
      { id: '5a', text: 'Full-time (weekdays)', icon: Clock, value: 'fulltime' },
      { id: '5b', text: 'Part-time (evenings/weekends)', icon: Clock, value: 'parttime' },
      { id: '5c', text: 'Online/self-paced', icon: Code, value: 'online' }
    ]
  }
];

const programs: Program[] = [
  {
    id: 'healthcare-assistant',
    name: 'Certified Nursing Assistant (CNA)',
    description: 'Provide essential care and support to patients in hospitals, nursing homes, and care facilities. Learn vital signs monitoring, patient hygiene, mobility assistance, and basic medical procedures. This fast-track program prepares you for immediate employment in the growing healthcare field.',
    duration: '4-8 weeks',
    salary: '$32K-$45K',
    demand: 'Very High',
    icon: Stethoscope,
    matchScore: 0,
    path: '/programs/certified-nursing-assistant'
  },
  {
    id: 'medical-coding',
    name: 'Medical Coding & Billing',
    description: 'Work from home processing medical records, insurance claims, and healthcare documentation. Learn ICD-10, CPT coding, medical terminology, and billing software. High demand for remote positions with flexible schedules and excellent job security.',
    duration: '12-16 weeks',
    salary: '$42K-$52K',
    demand: 'High',
    icon: Code,
    matchScore: 0,
    path: '/programs/medical-coding-billing'
  },
  {
    id: 'hvac',
    name: 'HVAC Technician',
    description: 'Install, maintain, and repair heating, ventilation, and air conditioning systems. Learn electrical systems, refrigeration, troubleshooting, and EPA certification. High-paying skilled trade with year-round demand and opportunities for self-employment.',
    duration: '16-20 weeks',
    salary: '$48K-$65K',
    demand: 'Very High',
    icon: Wrench,
    matchScore: 0,
    path: '/programs/hvac-technician'
  },
  {
    id: 'cosmetology',
    name: 'Cosmetology',
    description: 'Master hair cutting, styling, coloring, chemical treatments, and salon management. Build your own clientele, work in high-end salons, or open your own business. Creative career with flexible hours and unlimited earning potential through tips and commissions.',
    duration: '12-18 months',
    salary: '$35K-$60K+',
    demand: 'High',
    icon: Scissors,
    matchScore: 0,
    path: '/programs/cosmetology'
  },
  {
    id: 'cdl',
    name: 'CDL Class A Training',
    description: 'Get your commercial driver\'s license and start earning immediately. Learn to operate tractor-trailers, pass DOT requirements, and secure high-paying trucking jobs. Many companies offer sign-on bonuses and benefits. Start earning $55K+ in just 4-6 weeks.',
    duration: '4-6 weeks',
    salary: '$55K-$75K',
    demand: 'Very High',
    icon: Truck,
    matchScore: 0,
    path: '/programs/cdl-class-a'
  },
  {
    id: 'phlebotomy',
    name: 'Phlebotomy Technician',
    description: 'Draw blood and collect samples for medical testing in hospitals, labs, and clinics. Quick entry into healthcare with minimal training time. Learn venipuncture techniques, patient care, lab safety, and specimen handling. High demand with flexible shift options.',
    duration: '6-8 weeks',
    salary: '$32K-$42K',
    demand: 'High',
    icon: Stethoscope,
    matchScore: 0,
    path: '/programs/phlebotomy-technician'
  }
];

export default function ProgramFinder() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [recommendations, setRecommendations] = useState<Program[]>([]);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(prev => prev + 1);
      }, 300);
    } else {
      // Calculate recommendations
      setTimeout(() => {
        calculateRecommendations();
      }, 300);
    }
  };

  const calculateRecommendations = () => {
    const scored = programs.map(program => {
      let score = 0;

      // Interest matching
      if (answers[1] === 'healthcare' && program.id.includes('health')) score += 30;
      if (answers[1] === 'trades' && program.id === 'hvac') score += 30;
      if (answers[1] === 'beauty' && program.id === 'cosmetology') score += 30;
      if (answers[1] === 'transportation' && program.id === 'cdl') score += 30;
      if (answers[1] === 'technology' && program.id === 'medical-coding') score += 30;

      // Timeline matching
      if (answers[2] === 'fast') {
        if (program.id === 'cdl' || program.id === 'phlebotomy') score += 20;
      } else if (answers[2] === 'medium') {
        if (program.id === 'healthcare-assistant' || program.id === 'medical-coding') score += 20;
      }

      // Goal matching
      if (answers[3] === 'income' && (program.id === 'hvac' || program.id === 'cdl')) score += 15;
      if (answers[3] === 'employment' && program.demand === 'Very High') score += 15;

      // Experience matching
      if (answers[4] === 'beginner') {
        if (program.id === 'phlebotomy' || program.id === 'healthcare-assistant') score += 10;
      }

      // Schedule matching
      if (answers[5] === 'online' && program.id === 'medical-coding') score += 15;

      return { ...program, matchScore: score };
    });

    const sorted = scored.sort((a, b) => b.matchScore - a.matchScore);
    setRecommendations(sorted.slice(0, 3));
    setShowResults(true);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    setRecommendations([]);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResults) {
    return (
      <section className="py-20    ">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              <CheckCircle className="w-4 h-4" />
              Your Personalized Results
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Perfect Programs for You
            </h2>
            <p className="text-xl text-black">
              Based on your answers, here are the programs that match your goals and interests.
            </p>
          </motion.div>

          <div className="space-y-6 mb-12">
            {recommendations.map((program, index) => {
              const Icon = program.icon;
              return (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16    rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-black">
                              {program.name}
                            </h3>
                            {index === 0 && (
                              <span className="px-3 py-2 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                BEST MATCH
                              </span>
                            )}
                          </div>
                          <p className="text-black mb-4">
                            {program.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-brand-blue-600 mb-1">
                          {program.matchScore}%
                        </div>
                        <div className="text-sm text-gray-500">Match</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center gap-2 text-black">
                        <Clock className="w-5 h-5 text-brand-blue-600" />
                        <div>
                          <div className="text-xs text-gray-500">Duration</div>
                          <div className="font-semibold">{program.duration}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-black">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500">Salary Range</div>
                          <div className="font-semibold">{program.salary}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-black">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-xs text-gray-500">Job Demand</div>
                          <div className="font-semibold">{program.demand}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <a
                        href={program.path}
                        className="flex-1 px-6 py-3    text-white rounded-lg font-semibold hover: hover: transition-all text-center"
                      >
                        Learn More
                      </a>
                      <a
                        href="/apply"
                        className="flex-1 px-6 py-3 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition-all text-center flex items-center justify-center gap-2"
                      >
                        Apply Now
                        <ArrowRight className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center space-y-4">
            <button
              onClick={handleRestart}
              className="px-8 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md"
            >
              Start Over
            </button>
            <p className="text-black">
              Not sure yet? <a href="/programs" className="text-brand-blue-600 hover:underline">Browse all programs</a>
            </p>
          </div>
        </div>
      </section>
    );
  }

  const question = questions[currentQuestion];

  return (
    <section className="py-20     min-h-screen flex items-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 text-brand-blue-700 rounded-full text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            Find Your Perfect Program
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Let's Find Your Path
          </h2>
          <p className="text-xl text-black">
            Answer 5 quick questions to get personalized program recommendations
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-black">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-black">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full   "
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
          >
            <h3 className="text-3xl font-bold text-black mb-8 text-center">
              {question.question}
            </h3>

            <div className="grid gap-4">
              {question.options.map((option) => {
                const Icon = option.icon;
                const isSelected = answers[question.id] === option.value;

                return (
                  <motion.button
                    key={option.id}
                    onClick={() => handleAnswer(question.id, option.value)}
                    className={`p-6 rounded-xl border-2 transition-all text-left flex items-center gap-4 group ${
                      isSelected
                        ? 'border-brand-blue-600 bg-brand-blue-50'
                        : 'border-gray-200 hover:border-brand-blue-400 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-brand-blue-600 text-white'
                        : 'bg-gray-100 text-black group-hover:bg-brand-blue-600 group-hover:text-white'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-semibold text-black flex-1">
                      {option.text}
                    </span>
                    {isSelected && (
                      <CheckCircle className="w-6 h-6 text-brand-blue-600" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              currentQuestion === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-50 shadow-md'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-center">
            <p className="text-sm text-black">
              Takes less than 2 minutes
            </p>
          </div>

          <div className="w-24" /> {/* Spacer for alignment */}
        </div>
      </div>
    </section>
  );
}
