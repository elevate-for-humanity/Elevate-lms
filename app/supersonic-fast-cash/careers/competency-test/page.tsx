'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const COMPETENCY_QUESTIONS: Question[] = [
  // Filing Status Questions
  {
    id: 1,
    question: 'What is the standard deduction for a single filer in 2024?',
    options: ['$12,950', '$13,850', '$14,600', '$27,700'],
    correctAnswer: 2,
    category: 'Tax Basics',
  },
  {
    id: 2,
    question:
      'Which filing status typically results in the lowest tax liability for a married couple?',
    options: [
      'Single',
      'Married Filing Jointly',
      'Married Filing Separately',
      'Head of Household',
    ],
    correctAnswer: 1,
    category: 'Filing Status',
  },
  {
    id: 3,
    question: 'To qualify for Head of Household status, you must:',
    options: [
      'Be married',
      'Pay more than half the cost of keeping up a home',
      'Have no dependents',
      'File jointly with spouse',
    ],
    correctAnswer: 1,
    category: 'Filing Status',
  },

  // Income Questions
  {
    id: 4,
    question: 'Which form reports wages and salary income?',
    options: ['Form 1099-MISC', 'Form W-2', 'Form 1040', 'Schedule C'],
    correctAnswer: 1,
    category: 'Income',
  },
  {
    id: 5,
    question: 'Self-employment income is reported on which schedule?',
    options: ['Schedule A', 'Schedule B', 'Schedule C', 'Schedule D'],
    correctAnswer: 2,
    category: 'Income',
  },
  {
    id: 6,
    question: 'What is the self-employment tax rate for 2024?',
    options: ['12.4%', '15.3%', '22%', '24%'],
    correctAnswer: 1,
    category: 'Self-Employment',
  },

  // Deductions Questions
  {
    id: 7,
    question: 'Itemized deductions are reported on which schedule?',
    options: ['Schedule A', 'Schedule B', 'Schedule C', 'Schedule D'],
    correctAnswer: 0,
    category: 'Deductions',
  },
  {
    id: 8,
    question: 'Which of the following is NOT deductible as a business expense?',
    options: [
      'Office supplies',
      'Business meals (50%)',
      'Personal groceries',
      'Professional fees',
    ],
    correctAnswer: 2,
    category: 'Deductions',
  },
  {
    id: 9,
    question: 'The home office deduction requires:',
    options: [
      'Any space used occasionally for work',
      'Regular and exclusive use for business',
      'A separate building only',
      'No other workplace',
    ],
    correctAnswer: 1,
    category: 'Deductions',
  },

  // Credits Questions
  {
    id: 10,
    question:
      'What is the maximum Child Tax Credit per qualifying child in 2024?',
    options: ['$1,000', '$2,000', '$3,000', '$3,600'],
    correctAnswer: 1,
    category: 'Credits',
  },
  {
    id: 11,
    question: 'The Earned Income Tax Credit (EITC) is:',
    options: [
      'A non-refundable credit',
      'A refundable credit',
      'Only for high-income earners',
      'Not available to self-employed',
    ],
    correctAnswer: 1,
    category: 'Credits',
  },
  {
    id: 12,
    question: 'Which education credit has a maximum of $2,500 per student?',
    options: [
      'Lifetime Learning Credit',
      'American Opportunity Credit',
      'Hope Credit',
      'Pell Grant',
    ],
    correctAnswer: 1,
    category: 'Credits',
  },

  // E-Filing Questions
  {
    id: 13,
    question: 'What does EFIN stand for?',
    options: [
      'Electronic Filing Identification Number',
      'E-File Information Network',
      'Electronic Federal Income Number',
      'E-File Integration Number',
    ],
    correctAnswer: 0,
    category: 'E-Filing',
  },
  {
    id: 14,
    question: 'A PTIN is required for:',
    options: [
      'All taxpayers',
      'Only CPAs',
      'Anyone who prepares tax returns for compensation',
      'Only enrolled agents',
    ],
    correctAnswer: 2,
    category: 'Professional Requirements',
  },
  {
    id: 15,
    question: 'What is the deadline for most individual tax returns?',
    options: ['March 15', 'April 15', 'June 15', 'October 15'],
    correctAnswer: 1,
    category: 'Deadlines',
  },

  // Drake Software Questions
  {
    id: 16,
    question: 'In Drake Software, which key opens the forms view?',
    options: ['F1', 'F5', 'F9', 'F12'],
    correctAnswer: 1,
    category: 'Drake Software',
  },
  {
    id: 17,
    question: "Drake's e-file transmission is accessed through:",
    options: ['File menu', 'Tools menu', 'Transmit menu', 'E-File menu'],
    correctAnswer: 2,
    category: 'Drake Software',
  },
  {
    id: 18,
    question: "What does Drake's 'Calculate' function do?",
    options: [
      'Only checks for errors',
      'Computes tax liability and generates forms',
      'Transmits the return',
      'Prints the return',
    ],
    correctAnswer: 1,
    category: 'Drake Software',
  },

  // Ethics & Compliance
  {
    id: 19,
    question: 'Due diligence requirements apply to which credits?',
    options: [
      'All credits',
      'EITC, CTC, AOTC, and HOH',
      'Only EITC',
      'No credits require due diligence',
    ],
    correctAnswer: 1,
    category: 'Ethics',
  },
  {
    id: 20,
    question: 'Taxpayer information must be kept confidential under:',
    options: [
      'IRS Circular 230',
      'IRC Section 7216',
      'PTIN requirements',
      'State law only',
    ],
    correctAnswer: 1,
    category: 'Ethics',
  },

  // Additional Questions
  {
    id: 21,
    question: 'Capital gains from assets held more than one year are taxed at:',
    options: [
      'Ordinary income rates',
      'Preferential long-term rates',
      '50% of ordinary rates',
      'Not taxed',
    ],
    correctAnswer: 1,
    category: 'Capital Gains',
  },
  {
    id: 22,
    question: 'Which retirement contribution is NOT tax-deductible?',
    options: ['Traditional IRA', '401(k)', 'Roth IRA', 'SEP IRA'],
    correctAnswer: 2,
    category: 'Retirement',
  },
  {
    id: 23,
    question: 'The Additional Child Tax Credit is:',
    options: [
      'Non-refundable',
      'Refundable',
      'Only for high earners',
      'Eliminated in 2024',
    ],
    correctAnswer: 1,
    category: 'Credits',
  },
  {
    id: 24,
    question: 'Estimated tax payments are required when tax liability exceeds:',
    options: ['$500', '$1,000', '$2,000', '$5,000'],
    correctAnswer: 1,
    category: 'Estimated Taxes',
  },
  {
    id: 25,
    question: 'Which form is used to report cryptocurrency transactions?',
    options: ['Form 8949', 'Schedule D', 'Form 1099-B', 'All of the above'],
    correctAnswer: 3,
    category: 'Cryptocurrency',
  },
  {
    id: 26,
    question:
      'The standard mileage rate for business use in 2024 is approximately:',
    options: ['$0.45/mile', '$0.56/mile', '$0.67/mile', '$0.75/mile'],
    correctAnswer: 2,
    category: 'Deductions',
  },
  {
    id: 27,
    question: 'A taxpayer can amend a return using:',
    options: ['Form 1040', 'Form 1040-X', 'Form 1099', 'Schedule A'],
    correctAnswer: 1,
    category: 'Amendments',
  },
  {
    id: 28,
    question: 'Health Savings Account (HSA) contributions are:',
    options: [
      'Not deductible',
      'Deductible above-the-line',
      'Itemized deductions',
      'Credits',
    ],
    correctAnswer: 1,
    category: 'Deductions',
  },
  {
    id: 29,
    question: 'The penalty for early withdrawal from a traditional IRA is:',
    options: ['5%', '10%', '15%', '20%'],
    correctAnswer: 1,
    category: 'Retirement',
  },
  {
    id: 30,
    question:
      'Which document authorizes a preparer to represent a taxpayer before the IRS?',
    options: ['Form W-2', 'Form 8879', 'Form 2848', 'Form 1040'],
    correctAnswer: 2,
    category: 'Professional Requirements',
  },
];



export default function CompetencyTest() {
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(
    new Array(COMPETENCY_QUESTIONS.length).fill(-1)
  );
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes in seconds
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantName, setApplicantName] = useState('');

  useEffect(() => {
    if (started && !submitted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, submitted, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    // Calculate score
    let correct = 0;
    COMPETENCY_QUESTIONS.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) {
        correct++;
      }
    });
    const percentage = Math.round(
      (correct / COMPETENCY_QUESTIONS.length) * 100
    );
    setScore(percentage);
    setSubmitted(true);

    // Save to database
    try {
      await fetch('/api/supersonic-fast-cash/competency-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: applicantEmail,
          name: applicantName,
          score: percentage,
          answers,
          timeSpent: 45 * 60 - timeRemaining,
          passed: percentage >= 80,
        }),
      });

      // If passed, automatically generate access key
      if (percentage >= 80) {
        try {
          await fetch('/api/supersonic-fast-cash/generate-access-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: applicantEmail,
              name: applicantName,
              testScore: percentage,
            }),
          });
        } catch (error) {
          logger.error('Failed to generate access key:', error);
        }
      }
    } catch (error) {
      logger.error('Failed to save test results:', error);
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-6">
              Tax Preparer Competency Test
            </h1>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h2 className="font-bold text-lg mb-3">Test Information:</h2>
              <ul className="space-y-2 text-sm">
                <li>
                  • <strong>30 questions</strong> covering tax preparation
                  knowledge
                </li>
                <li>
                  • <strong>45 minutes</strong> time limit
                </li>
                <li>
                  • <strong>80% passing score</strong> required (24/30 correct)
                </li>
                <li>
                  • Topics: Filing status, income, deductions, credits, Drake
                  Software, ethics
                </li>
                <li>• Multiple choice format</li>
                <li>• Results available immediately</li>
              </ul>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-semibold mb-2">Your Name *</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block font-semibold mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={applicantEmail}
                  onChange={(e) => setApplicantEmail(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder="your.email@gmail.com"
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (applicantName && applicantEmail) {
                  setStarted(true);
                } else {
                  alert('Please enter your name and email');
                }
              }}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    const passed = score >= 80;
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              {passed ? (
                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
              ) : (
                <XCircle className="w-20 h-20 text-red-600 mx-auto mb-4" />
              )}
              <h1 className="text-3xl font-bold mb-2">
                {passed ? 'Congratulations!' : 'Test Not Passed'}
              </h1>
              <p className="text-xl text-black">
                Your Score:{' '}
                <strong className={passed ? 'text-green-600' : 'text-red-600'}>
                  {score}%
                </strong>
              </p>
              <p className="text-sm text-black mt-2">
                ({Math.round((score / 100) * COMPETENCY_QUESTIONS.length)}/
                {COMPETENCY_QUESTIONS.length} correct)
              </p>
            </div>

            {passed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-3">Next Steps:</h2>
                <ol className="list-decimal pl-6 space-y-2 text-sm">
                  <li>
                    You will receive an email confirmation within 24 hours
                  </li>
                  <li>Our HR team will schedule your interview</li>
                  <li>Background check and reference verification</li>
                  <li>
                    Complete onboarding paperwork (W-4, I-9, direct deposit)
                  </li>
                  <li>Begin Drake Software training</li>
                  <li>Start preparing tax returns!</li>
                </ol>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <h2 className="font-bold text-lg mb-3">What's Next:</h2>
                <p className="text-sm mb-3">
                  You need a score of 80% or higher to pass. You may retake the
                  test after 7 days.
                </p>
                <p className="text-sm">
                  We recommend reviewing tax preparation materials and Drake
                  Software documentation before retaking.
                </p>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="font-bold mb-3">Score Breakdown by Category:</h3>
              <div className="space-y-2 text-sm">
                {Array.from(
                  new Set(COMPETENCY_QUESTIONS.map((q) => q.category))
                ).map((category) => {
                  const categoryQuestions = COMPETENCY_QUESTIONS.filter(
                    (q) => q.category === category
                  );
                  const categoryCorrect = categoryQuestions.filter((q, idx) => {
                    const questionIndex = COMPETENCY_QUESTIONS.findIndex(
                      (question) => question.id === q.id
                    );
                    return answers[questionIndex] === q.correctAnswer;
                  }).length;
                  const categoryScore = Math.round(
                    (categoryCorrect / categoryQuestions.length) * 100
                  );

                  return (
                    <div
                      key={category}
                      className="flex justify-between items-center"
                    >
                      <span>{category}</span>
                      <span
                        className={
                          categoryScore >= 80
                            ? 'text-green-600 font-semibold'
                            : 'text-red-600'
                        }
                      >
                        {categoryCorrect}/{categoryQuestions.length} (
                        {categoryScore}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() =>
                (window.location.href = '/supersonic-fast-cash/careers')
              }
              className="w-full mt-6 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700"
            >
              Return to Careers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = COMPETENCY_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / COMPETENCY_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Competency Test" }]} />
      </div>
<div className="max-w-3xl mx-auto px-6">
        {/* Timer */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-black" />
            <span className="font-semibold">Time Remaining:</span>
            <span
              className={`font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-green-600'}`}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
          <div className="text-sm text-black">
            Question {currentQuestion + 1} of {COMPETENCY_QUESTIONS.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-2 text-sm text-black">{question.category}</div>
          <h2 className="text-xl font-bold mb-6">{question.question}</h2>

          <div className="space-y-3 mb-8">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion] === index
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion] === index
                        ? 'border-green-600 bg-green-600'
                        : 'border-gray-400'
                    }`}
                  >
                    {answers[currentQuestion] === index && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() =>
                setCurrentQuestion(Math.max(0, currentQuestion - 1))
              }
              disabled={currentQuestion === 0}
              className="flex-1 bg-gray-300 text-black py-3 rounded-lg font-bold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestion < COMPETENCY_QUESTIONS.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                Submit Test
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="mt-6 pt-6 border-t">
            <div className="text-sm font-semibold mb-3">
              Question Navigator:
            </div>
            <div className="grid grid-cols-10 gap-2">
              {COMPETENCY_QUESTIONS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm ${
                    index === currentQuestion
                      ? 'bg-green-600 text-white'
                      : answers[index] !== -1
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-black border border-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-black">
              Answered: {answers.filter((a) => a !== -1).length}/
              {COMPETENCY_QUESTIONS.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
