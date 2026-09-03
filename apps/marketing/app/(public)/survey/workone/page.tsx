'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

interface SurveyQuestion {
  id: string;
  type: 'radio' | 'checkbox' | 'textarea' | 'text';
  question: string;
  description?: string;
  options?: string[];
  required: boolean;
  order: number;
}

interface SurveyConfig {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

function WorkOneSurveyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [survey, setSurvey] = useState<SurveyConfig | null>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Missing survey link. Please use the link from your email.');
      setLoading(false);
      return;
    }

    async function loadSurvey() {
      try {
        const res = await fetch(`/api/surveys/workone/submit?token=${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Invalid survey link');
          setLoading(false);
          return;
        }

        setSurvey(data.survey);
        setApplicantName(data.applicant?.name || '');
        setAlreadySubmitted(data.alreadySubmitted || false);
        setLoading(false);
      } catch (err) {
        setError('Failed to load survey');
        setLoading(false);
      }
    }

    loadSurvey();
  }, [token]);

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (!survey) return;
    const question = survey.questions[currentStep];
    if (!question) {
      setError('This survey has no question at the current step. Please request a new survey link.');
      return;
    }
    if (question.required && !answers[question.id]) {
      alert('Please answer this question to continue');
      return;
    }
    if (currentStep < survey.questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!token || !survey) return;
    
    // Validate all required questions
    for (const q of survey.questions) {
      if (q.required && !answers[q.id]) {
        alert('Please answer all required questions');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/surveys/workone/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to submit survey');
        return;
      }

      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Unavailable</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Already Completed</h1>
          <p className="text-gray-600 mb-4">
            Thank you, {applicantName}! You have already submitted your response to this survey.
          </p>
          <a
            href="/"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your response has been submitted. Your feedback helps us advocate for better support for students like you.
          </p>
          <a
            href="/"
            className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const currentQuestion = survey.questions[currentStep];
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Configuration Error</h1>
          <p className="text-gray-600">This survey has no available questions. Please request a new survey link.</p>
        </div>
      </div>
    );
  }
  const progress = ((currentStep + 1) / survey.questions.length) * 100;
  const isLastStep = currentStep === survey.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
          <p className="text-gray-600">{survey.description}</p>
          {applicantName && (
            <p className="text-sm text-gray-500 mt-2">Hello, {applicantName}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentStep + 1} of {survey.questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentQuestion.question}
            {currentQuestion.required && <span className="text-red-500 ml-1">*</span>}
          </h2>
          {currentQuestion.description && (
            <p className="text-gray-500 text-sm mb-6">{currentQuestion.description}</p>
          )}

          {/* Radio/Checkbox options */}
          {(currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = currentQuestion.type === 'checkbox'
                  ? (answers[currentQuestion.id] || []).includes(option)
                  : answers[currentQuestion.id] === option;

                return (
                  <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type={currentQuestion.type}
                      name={currentQuestion.id}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQuestion.id, option)}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Textarea */}
          {currentQuestion.type === 'textarea' && (
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none min-h-[120px] resize-y"
            />
          )}

          {/* Text input */}
          {currentQuestion.type === 'text' && (
            <input
              type="text"
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Survey
                  <CheckCircle className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkOneSurveyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><span>Loading...</span></div>}>
      <WorkOneSurveyContent />
    </Suspense>
  );
}
