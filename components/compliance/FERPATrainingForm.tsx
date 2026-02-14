"use client";

import { createClient } from '@/lib/supabase/client';

import React from 'react';
import { memo } from 'react';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import {
  CheckCircle,
  FileText,
  Shield,
  AlertCircle,
  Download,
  RefreshCw
} from 'lucide-react';

interface FERPATrainingFormProps {
  user: any;
  existingTraining?: any;
}

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'What does FERPA stand for?',
    options: [
      'Federal Education Records Protection Act',
      'Family Educational Rights and Privacy Act',
      'Federal Enrollment Rights and Privacy Act',
      'Family Education Regulation and Protection Act'
    ],
    correct: 1
  },
  {
    id: 2,
    question: 'Which of the following is considered an education record under FERPA?',
    options: [
      'Parking tickets',
      'Student grades',
      'Campus maps',
      'Cafeteria menus'
    ],
    correct: 1
  },
  {
    id: 3,
    question: 'Who has the right to access education records?',
    options: [
      'Any employer',
      'Other students',
      'The student (or parent if under 18)',
      'Social media followers'
    ],
    correct: 2
  },
  {
    id: 4,
    question: 'What type of information requires written consent before disclosure?',
    options: [
      'Directory information',
      'Non-directory information',
      'Public records',
      'Course descriptions'
    ],
    correct: 1
  },
  {
    id: 5,
    question: 'Which action violates FERPA?',
    options: [
      'Securely posting grades in LMS',
      'Sharing grades with unauthorized persons',
      'Using role-based access',
      'Encrypting data'
    ],
    correct: 1
  },
  {
    id: 6,
    question: 'What must an LMS do to support FERPA compliance?',
    options: [
      'Allow shared logins',
      'Display student grades publicly',
      'Use secure logins and role-based access',
      'Disable audit logs'
    ],
    correct: 2
  },
  {
    id: 7,
    question: 'How often should FERPA training be completed?',
    options: [
      'One time only',
      'Every 10 years',
      'Annually',
      'Never'
    ],
    correct: 2
  },
  {
    id: 8,
    question: 'Which of the following is directory information (unless student opts out)?',
    options: [
      'Grades',
      'Attendance',
      'Student name',
      'Disability records'
    ],
    correct: 2
  },
  {
    id: 9,
    question: 'What should staff do if they suspect a FERPA violation?',
    options: [
      'Ignore it',
      'Post it publicly',
      'Report it according to policy',
      'Share with coworkers'
    ],
    correct: 2
  },
  {
    id: 10,
    question: 'Why is FERPA important for accreditation?',
    options: [
      'It replaces accreditation',
      'It proves financial stability',
      'It demonstrates student privacy compliance',
      'It guarantees funding'
    ],
    correct: 2
  }
];

export default function FERPATrainingForm({ user, existingTraining }: FERPATrainingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const signatureRef = useRef<SignatureCanvas>(null);
  const confidentialitySignatureRef = useRef<SignatureCanvas>(null);

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);

  const [trainingAcknowledged, setTrainingAcknowledged] = useState(false);
  const [confidentialityAcknowledged, setConfidentialityAcknowledged] = useState(false);
  const [signature, setSignature] = useState('');
  const [confidentialitySignature, setConfidentialitySignature] = useState('');

  const totalSteps = 4;

  // Load user's FERPA training history from DB
  useEffect(() => {
    async function loadTrainingHistory() {
      if (!user?.id) return;
      const { data } = await supabase
        .from('ferpa_training')
        .select('id, quiz_score, passed, completed_at, certificate_id')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (data) setTrainingHistory(data);
    }
    loadTrainingHistory();
  }, [user?.id, supabase]);

  const calculateScore = () => {
    let correct = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correct) {
        correct++;
      }
    });
    const percentage = (correct / QUIZ_QUESTIONS.length) * 100;
    setScore(percentage);
    setPassed(percentage >= 80);
    return percentage;
  };

  const handleQuizSubmit = () => {
    const finalScore = calculateScore();
    if (finalScore >= 80) {
      setStep(3);
    } else {
      setError('You must score 80% or higher to pass. Please review the training materials and try again.');
    }
  };

  const clearSignature = () => {
    signatureRef.current?.clear();
    setSignature('');
  };

  const clearConfidentialitySignature = () => {
    confidentialitySignatureRef.current?.clear();
    setConfidentialitySignature('');
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL();
      setSignature(dataUrl);
    }
  };

  const saveConfidentialitySignature = () => {
    if (confidentialitySignatureRef.current) {
      const dataUrl = confidentialitySignatureRef.current.toDataURL();
      setConfidentialitySignature(dataUrl);
    }
  };

  const handleFinalSubmit = async () => {
    if (!signature || !confidentialitySignature) {
      setError('Both signatures are required');
      return;
    }

    if (!trainingAcknowledged || !confidentialityAcknowledged) {
      setError('You must acknowledge all agreements');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ferpa/training/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          quiz_score: score,
          quiz_answers: answers,
          training_signature: signature,
          confidentiality_signature: confidentialitySignature,
          training_acknowledged: trainingAcknowledged,
          confidentiality_acknowledged: confidentialityAcknowledged,
          ip_address: window.location.hostname,
          user_agent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit training');
      }

      const data = await response.json();

      // Show success and redirect
      setStep(4);
      setTimeout(() => {
        router.push('/ferpa/training/certificate/' + data.certificate_id);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit training');
    } finally {
      setLoading(false);
    }
  };

  if (existingTraining && new Date(existingTraining.completed_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-black mb-4">
                Training Already Completed
              </h1>
              <p className="text-black mb-6">
                You completed FERPA training on {new Date(existingTraining.completed_at).toLocaleDateString()}.
                Your certification is valid until {new Date(new Date(existingTraining.completed_at).setFullYear(new Date(existingTraining.completed_at).getFullYear() + 1)).toLocaleDateString()}.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/ferpa/training/certificate/' + existingTraining.id)}
                  className="px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
                >
                  View Certificate
                </button>
                <button
                  onClick={() => router.push('/ferpa')}
                  className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
                >
                  Back to FERPA Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-black">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-black">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-brand-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Training Materials */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-brand-blue-600" />
              <h1 className="text-3xl font-bold text-black">
                FERPA Training Course
              </h1>
            </div>

            <div className="prose max-w-none mb-8">
              <h2>Welcome to FERPA Training</h2>
              <p>
                This training course will teach you about the Family Educational Rights and Privacy Act (FERPA)
                and your responsibilities for protecting student education records.
              </p>

              <h3>What You'll Learn</h3>
              <ul>
                <li>FERPA requirements and scope</li>
                <li>Student rights under FERPA</li>
                <li>Education records vs. non-education records</li>
                <li>Disclosure rules and exceptions</li>
                <li>LMS security and privacy</li>
                <li>Violation consequences and reporting</li>
              </ul>

              <h3>Training Requirements</h3>
              <ul>
                <li>Review all training materials</li>
                <li>Pass assessment with 80% or higher</li>
                <li>Sign training acknowledgment</li>
                <li>Sign confidentiality agreement</li>
                <li>Complete within 30 days of hire</li>
                <li>Renew annually</li>
              </ul>

              <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 my-6">
                <h4 className="text-brand-blue-900 font-semibold mb-2">📚 Training Materials</h4>
                <p className="text-brand-blue-800 mb-4">
                  Please review the following materials before proceeding to the assessment:
                </p>
                <div className="space-y-2">
                  <a
                    href="/docs/compliance/ferpa/FERPA_Policy_Manual.md"
                    target="_blank"
                    className="block px-4 py-2 bg-white border border-brand-blue-300 rounded hover:bg-gray-50 transition"
                  >
                    📄 FERPA Policy & Procedures Manual
                  </a>
                  <a
                    href="/docs/compliance/ferpa/FERPA_Training_Course.md"
                    target="_blank"
                    className="block px-4 py-2 bg-white border border-brand-blue-300 rounded hover:bg-gray-50 transition"
                  >
                    📖 Complete Training Course
                  </a>
                  <a
                    href="/docs/compliance/lms/LMS_Policies_Manual.md"
                    target="_blank"
                    className="block px-4 py-2 bg-white border border-brand-blue-300 rounded hover:bg-gray-50 transition"
                  >
                    💻 LMS Policies & Procedures
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mb-6">
              <input
                type="checkbox"
                id="training-reviewed"
                checked={trainingAcknowledged}
                onChange={(e) => setTrainingAcknowledged(e.target.checked)}
                className="mt-1 w-5 h-5 text-brand-blue-600 rounded"
              />
              <label htmlFor="training-reviewed" className="text-black">
                I have reviewed all training materials and understand my responsibilities under FERPA
              </label>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!trainingAcknowledged}
              className="w-full px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Proceed to Assessment
            </button>
          </div>
        )}

        {/* Step 2: Assessment Quiz */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-black">
                FERPA Assessment Quiz
              </h1>
            </div>

            <div className="mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-900">
                  <strong>Passing Score:</strong> 80% (8 out of 10 correct)
                </p>
                <p className="text-yellow-800 text-sm mt-1">
                  You may retake the quiz if needed. Review training materials before retaking.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-brand-orange-600" />
                  <p className="text-red-900">{error}</p>
                </div>
                <button
                  onClick={() => {
                    setAnswers({});
                    setScore(null);
                    setPassed(false);
                    setError('');
                  }}
                  className="mt-3 px-4 py-2 bg-brand-orange-600 text-white rounded hover:bg-brand-orange-700 transition text-sm"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Retake Quiz
                </button>
              </div>
            )}

            <div className="space-y-6 mb-8">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="border border-slate-200 rounded-lg p-6">
                  <h3 className="font-semibold text-black mb-4">
                    {idx + 1}. {q.question}
                  </h3>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className="flex items-start gap-3 p-3 rounded hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={optIdx}
                          checked={answers[q.id] === optIdx}
                          onChange={() => setAnswers({ ...answers, [q.id]: optIdx })}
                          className="mt-1 w-4 h-4 text-brand-blue-600"
                        />
                        <span className="text-black">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-slate-200 text-black rounded-lg hover:bg-slate-300 transition"
              >
                Back to Training
              </button>
              <button
                onClick={handleQuizSubmit}
                disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Submit Assessment
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Signatures */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Score Display */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-black mb-2">
                  Assessment Passed!
                </h2>
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {score}%
                </p>
                <p className="text-black">
                  You answered {Math.round((score! / 100) * QUIZ_QUESTIONS.length)} out of {QUIZ_QUESTIONS.length} questions correctly
                </p>
              </div>
            </div>

            {/* Training Acknowledgment Signature */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-black mb-6">
                Training Acknowledgment
              </h2>

              <div className="prose max-w-none mb-6">
                <p>
                  I certify that I have completed the FERPA Training Course and understand my responsibilities
                  for protecting student education records under the Family Educational Rights and Privacy Act.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  Digital Signature *
                </label>
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                      className: 'w-full h-40 bg-white',
                    }}
                    onEnd={saveSignature}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-black">Sign above</p>
                  <button
                    onClick={clearSignature}
                    className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={user.full_name || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {/* Confidentiality Agreement Signature */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-8 h-8 text-purple-600" />
                <h2 className="text-2xl font-bold text-black">
                  FERPA Confidentiality Agreement
                </h2>
              </div>

              <div className="prose max-w-none mb-6">
                <h3>I agree to:</h3>
                <ul>
                  <li>Access student records only as necessary for my job duties</li>
                  <li>Not disclose student information to unauthorized individuals</li>
                  <li>Not discuss student information in public or unsecured environments</li>
                  <li>Use only approved institutional systems (LMS, email, databases)</li>
                  <li>Secure any downloaded or printed student records</li>
                  <li>Follow all institutional FERPA policies and procedures</li>
                  <li>Report suspected violations immediately</li>
                </ul>

                <h3>I understand that violations may result in:</h3>
                <ul>
                  <li>Disciplinary action up to and including termination</li>
                  <li>Loss of access to student records</li>
                  <li>Legal consequences</li>
                  <li>Institutional sanctions</li>
                </ul>
              </div>

              <div className="flex items-start gap-3 mb-6">
                <input
                  type="checkbox"
                  id="confidentiality-acknowledged"
                  checked={confidentialityAcknowledged}
                  onChange={(e) => setConfidentialityAcknowledged(e.target.checked)}
                  className="mt-1 w-5 h-5 text-brand-blue-600 rounded"
                />
                <label htmlFor="confidentiality-acknowledged" className="text-black">
                  I have read and agree to the FERPA Confidentiality Agreement and understand the consequences of violations
                </label>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-black mb-2">
                  Digital Signature *
                </label>
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <SignatureCanvas
                    ref={confidentialitySignatureRef}
                    canvasProps={{
                      className: 'w-full h-40 bg-white',
                    }}
                    onEnd={saveConfidentialitySignature}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-sm text-black">Sign above</p>
                  <button
                    onClick={clearConfidentialitySignature}
                    className="text-sm text-brand-blue-600 hover:text-brand-blue-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={user.full_name || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user.role || ''}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString()}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-brand-orange-600" />
                  <p className="text-red-900">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-slate-200 text-black rounded-lg hover:bg-slate-300 transition"
              >
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !signature || !confidentialitySignature || !confidentialityAcknowledged}
                className="flex-1 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Complete Training & Get Certificate'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-black mb-4">
                Training Complete!
              </h1>
              <p className="text-black mb-6">
                Your FERPA training has been successfully completed and recorded.
                Your certificate is being generated...
              </p>
              <div className="animate-pulse text-brand-blue-600">
                Redirecting to your certificate...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
