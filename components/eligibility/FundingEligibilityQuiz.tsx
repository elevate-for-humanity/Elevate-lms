'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string; points: number }[];
  helpText?: string;
}

const ELIGIBILITY_QUESTIONS: Question[] = [
  {
    id: 'age',
    question: 'What is your age?',
    options: [
      { value: '18-24', label: '18-24 years old', points: 10 },
      { value: '25-54', label: '25-54 years old', points: 10 },
      { value: '55+', label: '55 or older', points: 10 },
      { value: 'under18', label: 'Under 18', points: 0 },
    ],
    helpText: 'WIOA programs serve adults 18 and older',
  },
  {
    id: 'employment',
    question: 'What is your current employment status?',
    options: [
      { value: 'unemployed', label: 'Unemployed', points: 15 },
      { value: 'underemployed', label: 'Employed part-time or low wage', points: 12 },
      { value: 'employed', label: 'Employed full-time', points: 5 },
      { value: 'laid_off', label: 'Recently laid off', points: 15 },
    ],
    helpText: 'Priority is given to unemployed and underemployed individuals',
  },
  {
    id: 'income',
    question: 'Is your household income below $40,000/year?',
    options: [
      { value: 'yes', label: 'Yes, below $40,000', points: 15 },
      { value: 'no', label: 'No, above $40,000', points: 5 },
      { value: 'unsure', label: 'Not sure', points: 10 },
    ],
    helpText: 'Low-income individuals receive priority for WIOA funding',
  },
  {
    id: 'education',
    question: 'What is your highest level of education?',
    options: [
      { value: 'no_hs', label: 'No high school diploma', points: 10 },
      { value: 'ged', label: 'GED or equivalent', points: 10 },
      { value: 'hs', label: 'High school diploma', points: 10 },
      { value: 'some_college', label: 'Some college', points: 10 },
      { value: 'degree', label: 'College degree', points: 8 },
    ],
  },
  {
    id: 'barriers',
    question: 'Do any of these apply to you? (Select the most relevant)',
    options: [
      { value: 'veteran', label: 'Veteran or military spouse', points: 15 },
      { value: 'disability', label: 'Person with a disability', points: 15 },
      { value: 'justice', label: 'Justice-involved individual', points: 15 },
      { value: 'single_parent', label: 'Single parent', points: 12 },
      { value: 'homeless', label: 'Homeless or housing insecure', points: 15 },
      { value: 'none', label: 'None of these apply', points: 5 },
    ],
    helpText: 'These groups receive priority for workforce funding',
  },
  {
    id: 'location',
    question: 'Do you live in Indiana?',
    options: [
      { value: 'indianapolis', label: 'Yes, in Indianapolis/Marion County', points: 15 },
      { value: 'indiana', label: 'Yes, elsewhere in Indiana', points: 12 },
      { value: 'other', label: 'No, outside Indiana', points: 0 },
    ],
    helpText: 'Our programs are available to Indiana residents',
  },
  {
    id: 'authorized',
    question: 'Are you authorized to work in the United States?',
    options: [
      { value: 'yes', label: 'Yes', points: 10 },
      { value: 'no', label: 'No', points: 0 },
      { value: 'pending', label: 'Pending authorization', points: 5 },
    ],
  },
];

const FUNDING_PROGRAMS = [
  { name: 'WIOA Adult', minScore: 60, description: 'Workforce Innovation and Opportunity Act funding for adults' },
  { name: 'WIOA Dislocated Worker', minScore: 55, description: 'For workers who lost jobs due to layoffs or closures' },
  { name: 'EmployIndy', minScore: 50, description: 'Indianapolis workforce development funding' },
  { name: 'JRI (Justice Reentry)', minScore: 45, description: 'For justice-involved individuals reentering workforce' },
  { name: 'Trade Adjustment Assistance', minScore: 40, description: 'For workers affected by foreign trade' },
];

export function FundingEligibilityQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [score, setScore] = useState(0);
  const [eligiblePrograms, setEligiblePrograms] = useState<typeof FUNDING_PROGRAMS>([]);

  const currentQuestion = ELIGIBILITY_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / ELIGIBILITY_QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const calculateEligibility = () => {
    setIsCalculating(true);
    
    let totalScore = 0;
    ELIGIBILITY_QUESTIONS.forEach((q) => {
      const answer = answers[q.id];
      const option = q.options.find((o) => o.value === answer);
      if (option) {
        totalScore += option.points;
      }
    });

    // Simulate calculation delay for UX
    setTimeout(() => {
      setScore(totalScore);
      setEligiblePrograms(FUNDING_PROGRAMS.filter((p) => totalScore >= p.minScore));
      setIsComplete(true);
      setIsCalculating(false);
    }, 1500);
  };

  const handleNext = () => {
    if (currentStep < ELIGIBILITY_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateEligibility();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsComplete(false);
    setScore(0);
    setEligiblePrograms([]);
  };

  if (isCalculating) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Checking Your Eligibility...</h2>
        <p className="text-slate-600">We're matching you with available funding programs</p>
      </div>
    );
  }

  if (isComplete) {
    const isEligible = eligiblePrograms.length > 0;
    
    return (
      <div className="max-w-2xl mx-auto">
        {/* Result Header */}
        <div className={`p-8 rounded-2xl text-center mb-8 ${isEligible ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
          {isEligible ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-green-800 mb-2">You Likely Qualify!</h2>
              <p className="text-green-700 text-lg">
                Based on your answers, you may be eligible for <strong>{eligiblePrograms.length}</strong> funding program{eligiblePrograms.length > 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-20 h-20 text-amber-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-amber-800 mb-2">Limited Funding Options</h2>
              <p className="text-amber-700 text-lg">
                You may not qualify for government funding, but we have affordable self-pay options
              </p>
            </>
          )}
        </div>

        {/* Eligible Programs */}
        {isEligible && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Programs You May Qualify For:</h3>
            <div className="space-y-3">
              {eligiblePrograms.map((program) => (
                <div key={program.name} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-900">{program.name}</h4>
                    <p className="text-sm text-slate-600">{program.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-3">Next Steps</h3>
          <ol className="space-y-2 text-blue-800">
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">1</span>
              <span>Complete a full application (takes 5-10 minutes)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">2</span>
              <span>Our team will verify your eligibility with funding agencies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">3</span>
              <span>Get enrolled in your chosen program - often at no cost to you</span>
            </li>
          </ol>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/apply"
            className="flex-1 bg-blue-600 text-white text-center py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Start Full Application
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={resetQuiz}
            className="flex-1 bg-slate-100 text-slate-700 text-center py-4 px-6 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Retake Quiz
          </button>
        </div>

        {/* Contact */}
        <p className="text-center text-slate-600 mt-6">
          Questions? Call us at <a href="/support" className="text-blue-600 font-semibold">Get Help Online</a>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Question {currentStep + 1} of {ELIGIBILITY_QUESTIONS.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentQuestion.question}</h2>
        {currentQuestion.helpText && (
          <p className="text-slate-600 mb-6">{currentQuestion.helpText}</p>
        )}

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleAnswer(option.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                answers[currentQuestion.id] === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  answers[currentQuestion.id] === option.value
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-slate-300'
                }`}>
                  {answers[currentQuestion.id] === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className={`flex-1 py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
            answers[currentQuestion.id]
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {currentStep === ELIGIBILITY_QUESTIONS.length - 1 ? 'Check My Eligibility' : 'Next'}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
