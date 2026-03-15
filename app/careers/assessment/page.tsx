'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, ChevronRight, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

// General-purpose competency questions for all Elevate staff roles
const QUESTIONS = [
  {
    id: 'q1',
    text: 'A student tells you they are about to be evicted and cannot focus on training. What is your first response?',
    options: [
      { id: 'a', text: 'Tell them to focus on training first and deal with housing later' },
      { id: 'b', text: 'Listen, document the barrier, and connect them to supportive services while keeping them enrolled' },
      { id: 'c', text: 'Suggest they pause enrollment until their situation stabilizes' },
      { id: 'd', text: 'Refer them to a different program better suited for their situation' },
    ],
    correct: 'b',
  },
  {
    id: 'q2',
    text: 'A parent calls asking for their adult child\'s enrollment records. Under FERPA, you should:',
    options: [
      { id: 'a', text: 'Provide the records since it\'s a parent' },
      { id: 'b', text: 'Provide a summary but not the full record' },
      { id: 'c', text: 'Decline and explain that adult student records require the student\'s written consent' },
      { id: 'd', text: 'Transfer the call to the director' },
    ],
    correct: 'c',
  },
  {
    id: 'q3',
    text: 'You notice a colleague is consistently late submitting attendance records. You should:',
    options: [
      { id: 'a', text: 'Cover for them by submitting the records yourself' },
      { id: 'b', text: 'Report them to HR immediately' },
      { id: 'c', text: 'Speak with them directly first, then escalate if the issue continues' },
      { id: 'd', text: 'Ignore it — it\'s not your responsibility' },
    ],
    correct: 'c',
  },
  {
    id: 'q4',
    text: 'A student disputes a grade and becomes verbally aggressive. Your best first step is:',
    options: [
      { id: 'a', text: 'Match their energy to establish authority' },
      { id: 'b', text: 'Immediately call security' },
      { id: 'c', text: 'Stay calm, acknowledge their frustration, and explain the formal grievance process' },
      { id: 'd', text: 'Change the grade to de-escalate the situation' },
    ],
    correct: 'c',
  },
  {
    id: 'q5',
    text: 'Which of the following best describes Elevate for Humanity\'s primary mission?',
    options: [
      { id: 'a', text: 'Providing affordable tuition-based college prep programs' },
      { id: 'b', text: 'Connecting people to funded workforce training and career pathways at no cost to eligible participants' },
      { id: 'c', text: 'Offering online degree programs for working adults' },
      { id: 'd', text: 'Providing job placement services for college graduates' },
    ],
    correct: 'b',
  },
  {
    id: 'q6',
    text: 'WIOA Title I funding requires that participants meet eligibility criteria. Who is responsible for verifying eligibility?',
    options: [
      { id: 'a', text: 'The student self-certifies with no staff verification needed' },
      { id: 'b', text: 'The state workforce board verifies eligibility automatically' },
      { id: 'c', text: 'Staff must collect and document eligibility evidence per program requirements' },
      { id: 'd', text: 'Eligibility is only verified at program completion' },
    ],
    correct: 'c',
  },
  {
    id: 'q7',
    text: 'You receive an email from someone claiming to be an employer asking for a list of all enrolled students. You should:',
    options: [
      { id: 'a', text: 'Send the list — employers are trusted partners' },
      { id: 'b', text: 'Send only names, not contact information' },
      { id: 'c', text: 'Verify the request through official channels and obtain student consent before sharing any information' },
      { id: 'd', text: 'Forward the email to a colleague to handle' },
    ],
    correct: 'c',
  },
  {
    id: 'q8',
    text: 'A student misses three consecutive classes without contact. Your next step is:',
    options: [
      { id: 'a', text: 'Wait for them to return on their own' },
      { id: 'b', text: 'Immediately drop them from the program' },
      { id: 'c', text: 'Attempt outreach by phone, email, and emergency contact; document all attempts' },
      { id: 'd', text: 'Mark them as withdrawn and notify financial aid' },
    ],
    correct: 'c',
  },
  {
    id: 'q9',
    text: 'When writing case notes about a student, you should:',
    options: [
      { id: 'a', text: 'Include your personal opinions about the student\'s attitude' },
      { id: 'b', text: 'Record only objective, factual observations and actions taken' },
      { id: 'c', text: 'Keep notes informal since they\'re internal documents' },
      { id: 'd', text: 'Avoid documenting sensitive information to protect the student' },
    ],
    correct: 'b',
  },
  {
    id: 'q10',
    text: 'Elevate\'s pay card option for employees is:',
    options: [
      { id: 'a', text: 'A credit card with a spending limit' },
      { id: 'b', text: 'A Visa debit card loaded on pay day — no bank account required' },
      { id: 'c', text: 'A prepaid gift card redeemable at partner stores only' },
      { id: 'd', text: 'An ACH transfer to a digital wallet' },
    ],
    correct: 'b',
  },
];

const PASSING_SCORE = 80;

function AssessmentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('applicationId') ?? '';
  const position = searchParams.get('position') ?? 'Staff Position';

  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  function selectAnswer(qId: string, optId: string) {
    setAnswers(a => ({ ...a, [qId]: optId }));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const correct = QUESTIONS.filter(q => answers[q.id] === q.correct).length;
      const pct = Math.round((correct / QUESTIONS.length) * 100);
      setScore(pct);

      // Save result
      await fetch('/api/careers/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, score: pct, answers, passed: pct >= PASSING_SCORE }),
      });

      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = QUESTIONS.every(q => answers[q.id]);
  const passed = score >= PASSING_SCORE;

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-10 text-center">
          {passed ? (
            <>
              <CheckCircle className="w-16 h-16 text-brand-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You Passed!</h2>
              <p className="text-4xl font-black text-brand-green-600 mb-2">{score}%</p>
              <p className="text-slate-500 mb-6">
                Excellent work. Our HR team will reach out within 2 business days to schedule your video interview.
              </p>
              <div className="bg-brand-green-50 border border-brand-green-200 rounded-xl p-4 text-sm text-brand-green-800 mb-6">
                Watch your email for an interview scheduling link from <strong>hr@elevateforhumanity.org</strong>
              </div>
              <button onClick={() => router.push('/careers')}
                className="w-full bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700">
                Back to Careers
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Keep Practicing</h2>
              <p className="text-4xl font-black text-amber-600 mb-2">{score}%</p>
              <p className="text-slate-500 mb-6">
                The passing score is {PASSING_SCORE}%. You're welcome to reapply in 30 days after reviewing our policies and mission.
              </p>
              <button onClick={() => router.push('/careers')}
                className="w-full bg-slate-700 text-white font-semibold py-3 rounded-xl hover:bg-slate-800">
                Back to Careers
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-brand-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Competency Assessment</h1>
            <p className="text-slate-500">{position} · Elevate for Humanity</p>
          </div>
          <div className="space-y-3 mb-8">
            {[
              ['Questions', `${QUESTIONS.length} multiple choice`],
              ['Time', 'Approximately 20–30 minutes'],
              ['Passing Score', `${PASSING_SCORE}% or higher`],
              ['Retake Policy', '30-day waiting period if not passed'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-4 text-sm text-slate-600 mb-6">
            Answer honestly — there are no trick questions. The assessment tests knowledge of student support, FERPA, WIOA, and Elevate's mission.
          </div>
          <button onClick={() => setStarted(true)}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-brand-blue-700 text-lg">
            Start Assessment <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[current];
  const progress = Math.round(((current + 1) / QUESTIONS.length) * 100);

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {QUESTIONS.length - current - 1} remaining</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div className="bg-brand-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border p-8 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-600 mb-3">Question {current + 1}</p>
          <h2 className="text-lg font-bold text-slate-900 mb-6 leading-snug">{q.text}</h2>
          <div className="space-y-3">
            {q.options.map(opt => (
              <button key={opt.id} type="button"
                onClick={() => selectAnswer(q.id, opt.id)}
                className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                  answers[q.id] === opt.id
                    ? 'border-brand-blue-600 bg-brand-blue-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}>
                <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 ${
                  answers[q.id] === opt.id
                    ? 'border-brand-blue-600 bg-brand-blue-600 text-white'
                    : 'border-slate-300 text-slate-400'
                }`}>{opt.id.toUpperCase()}</span>
                <span className={`text-sm leading-relaxed ${answers[q.id] === opt.id ? 'text-brand-blue-900 font-medium' : 'text-slate-700'}`}>
                  {opt.text}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={() => setCurrent(c => c - 1)}
              className="flex-1 py-3 border rounded-xl text-slate-700 font-medium hover:bg-white">
              Back
            </button>
          )}
          {current < QUESTIONS.length - 1 ? (
            <button onClick={() => setCurrent(c => c + 1)} disabled={!answers[q.id]}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-blue-700 disabled:opacity-40">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={!allAnswered || submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-green-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-green-700 disabled:opacity-40">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-blue-600" /></div>}>
      <AssessmentContent />
    </Suspense>
  );
}
