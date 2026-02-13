"use client";

import React from 'react';

import { useState } from 'react';
import { CheckCircle, XCircle, Phone } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  required: boolean;
}

const QUESTIONS: Question[] = [
  { id: 'indiana', text: 'I am an Indiana resident', required: true },
  { id: 'age', text: 'I am 18 years of age or older', required: true },
  {
    id: 'education',
    text: 'I have a high school diploma or GED',
    required: true,
  },
  {
    id: 'employment',
    text: 'I am currently unemployed or underemployed',
    required: false,
  },
  {
    id: 'career',
    text: 'I want to change careers or upgrade my skills',
    required: false,
  },
];

export function EligibilityChecker() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const handleCheck = (id: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    setShowResult(true);
  };

  const allRequiredAnswered = QUESTIONS.filter((q) => q.required).every(
    (q) => answers[q.id] !== undefined
  );

  const isEligible = QUESTIONS.filter((q) => q.required).every(
    (q) => answers[q.id] === true
  );

  const hasEmploymentCriteria =
    answers.employment === true || answers.career === true;

  const fullyEligible = isEligible && hasEmploymentCriteria;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <h3 className="text-2xl font-bold text-black mb-6 text-center">
          Check Your Eligibility
        </h3>

        <div className="space-y-4 mb-8">
          {QUESTIONS.map((question) => (
            <div
              key={question.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
            >
              <label
                htmlFor={question.id}
                className="text-black font-medium flex-1"
              >
                {question.text}
                {question.required && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleCheck(question.id, true)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    answers[question.id] === true
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-black border border-slate-300 hover:border-green-600'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleCheck(question.id, false)}
                  className={`px-6 py-2 rounded-lg font-semibold transition ${
                    answers[question.id] === false
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-black border border-slate-300 hover:border-red-600'
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRequiredAnswered}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
        >
          Check Eligibility
        </button>

        {showResult && (
          <div
            className={`mt-8 p-6 rounded-lg border-2 ${
              fullyEligible
                ? 'bg-green-50 border-green-600'
                : 'bg-yellow-50 border-yellow-600'
            }`}
          >
            {fullyEligible ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-11 w-11 text-green-600" />
                  <h4 className="text-2xl font-bold text-green-900">
                    You Qualify!
                  </h4>
                </div>
                <p className="text-green-900 mb-6">
                  Based on your responses, you appear eligible for free training
                  programs through workforce funding.
                </p>
                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <h5 className="font-bold text-green-900 mb-3">
                    What Happens Next:
                  </h5>
                  <ol className="space-y-2 text-green-900">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Click "Apply Now" below (takes 2 minutes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>An advisor calls you within 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>We handle all eligibility paperwork (1 week)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <span>You start training (1-2 weeks)</span>
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <XCircle className="h-11 w-11 text-yellow-600" />
                  <h4 className="text-2xl font-bold text-yellow-900">
                    Let's Talk About Your Options
                  </h4>
                </div>
                <p className="text-yellow-900 mb-6">
                  You may still qualify through alternative funding sources or
                  employer sponsorship. Let's discuss your situation.
                </p>
                <div className="bg-white rounded-lg p-6 border border-yellow-200">
                  <h5 className="font-bold text-yellow-900 mb-3">
                    Next Steps:
                  </h5>
                  <ul className="space-y-2 text-yellow-900 mb-4">
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Explore alternative funding sources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Connect with employer sponsors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>•</span>
                      <span>Discuss self-pay options (if needed)</span>
                    </li>
                  </ul>
                  <a
                    href="/support"
                    className="flex items-center justify-center gap-2 bg-yellow-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-yellow-700 transition"
                  >
                    <Phone className="h-5 w-5" />
                    Call Get Help Online
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
