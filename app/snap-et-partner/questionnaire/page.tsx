"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Send, Printer, ArrowLeft, CheckCircle } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    text: 'Are you a direct job training provider?',
    type: 'radio-expand',
    options: ['Yes', 'No'],
    followUps: {
      Yes: 'If yes, in what fields do you offer certifications?',
      No: 'If no, what direct services do you provide, and with whom do you partner for job training services?',
    },
  },
  {
    id: 2,
    text: 'How long is the average training?',
    type: 'textarea',
  },
  {
    id: 3,
    text: 'Are you actively engaged with employers who are hiring individuals who complete training through your agency?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 4,
    text: 'What are your funding sources? (specifics are not necessary — government or private/philanthropic sources)',
    type: 'textarea',
  },
  {
    id: 5,
    text: 'Approximately how many individuals per year participate in training through your organization?',
    type: 'text',
  },
  {
    id: 6,
    text: 'Does your program include job readiness / "soft skills" training?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 7,
    text: 'What percentage of participants are completing the training?',
    type: 'text',
    placeholder: 'e.g., 85%',
  },
  {
    id: 8,
    text: 'What percentage of training completers are obtaining employment within 60/90 days after completion of training?',
    type: 'text',
    placeholder: 'e.g., 80%',
  },
  {
    id: 9,
    text: 'What is the average beginning wage of program graduates?',
    type: 'text',
    placeholder: 'e.g., $18/hr',
  },
  {
    id: 10,
    text: 'Do you currently track employment rates with your participants?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 11,
    text: 'Do you remain involved with participants after they have finished their training / obtained employment?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 12,
    text: 'Do you currently provide any kind of supportive services for participants in your program, such as transportation, clothing, or other assistance to help them participate?',
    type: 'radio-expand',
    options: ['Yes', 'No'],
    followUps: {
      Yes: 'Please describe the supportive services you provide:',
    },
  },
  {
    id: 13,
    text: 'Would you be able to estimate how many of your participants are eligible for SNAP (either by questions you may be asking currently, or could add to your application process)?',
    type: 'textarea',
  },
  {
    id: 14,
    text: 'Is your agency capable of accounting for federal funding separate from all other funding sources, including accounting for staff time that may be spent on multiple projects?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 15,
    text: 'Is your agency capable of providing no less than weekly feedback for each SNAP E&T participant to the SNAP agency?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 16,
    text: 'Is your agency financially stable and able to cover 100% of your expenses, including any proposed services for SNAP E&T participants, without E&T funding? (Program growth should not be expected in the first year.)',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 17,
    text: 'Do you understand that a Third-Party Partnership is not a typical grant with upfront funding, but a reimbursement of 50% of approved, incurred costs?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 18,
    text: 'Do you understand that you cannot bill for services without an executed contract with the State of Indiana?',
    type: 'radio',
    options: ['Yes', 'No'],
  },
  {
    id: 19,
    text: 'How would becoming a SNAP Third Party Partner benefit your organization and those you serve?',
    type: 'textarea',
  },
];

type Answers = Record<string, string>;

export default function SNAPTPPQuestionnairePage() {
  const [agencyName, setAgencyName] = useState('Elevate for Humanity Career & Technical Institute');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const setAnswer = (key: string, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/snap-tpp/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agencyName, contactName, contactTitle, date, email, answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to send. Please try again.');
      }
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Questionnaire Sent</h1>
          <p className="text-slate-600 mb-2">
            A formatted copy has been sent to <strong>{email}</strong>.
          </p>
          <p className="text-slate-500 text-sm mb-8">
            A copy has also been submitted to our team for review and forwarding to DFR.
          </p>
          <Link href="/snap-et-partner" className="text-brand-blue-600 font-semibold hover:underline">
            ← Back to SNAP E&T Partner page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Print header — only visible when printing */}
      <div className="hidden print:block px-12 pt-10 pb-6 border-b-2 border-slate-300">
        <div className="flex items-center justify-between mb-4">
          <Image
            src="/images/Elevate_for_Humanity_logo_81bf0fab.jpg"
            alt="Elevate for Humanity"
            width={180}
            height={60}
            className="object-contain"
          />
          <div className="text-right text-sm text-slate-600">
            <p className="font-bold text-slate-900">Elevate for Humanity Career &amp; Technical Institute</p>
            <p>8888 Keystone Crossing, Suite 1300</p>
            <p>Indianapolis, IN 46240</p>
            <p>(317) 314-3757 | info@elevateforhumanity.org</p>
          </div>
        </div>
        <h1 className="text-xl font-bold text-slate-900 text-center mt-4">
          SNAP E&T Third Party Partnership — Questionnaire for Potential Partners
        </h1>
        <p className="text-center text-sm text-slate-500 mt-1">
          Submitted to: William "Joe" Gilles, BSBA — IMPACT Business Solutions Manager, Marion South Office
        </p>
      </div>

      {/* Screen header */}
      <div className="print:hidden bg-white border-b px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/snap-et-partner" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to SNAP E&T Partner
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 print:px-12 print:py-6">

        {/* Title */}
        <div className="print:hidden mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-2">Indiana FSSA / DFR</p>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            SNAP Third Party Partnership Questionnaire
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Complete all 19 questions. When finished, enter your email address and submit —
            a professionally formatted copy will be emailed to you and submitted to our team
            for forwarding to{' '}
            <strong>William "Joe" Gilles, IMPACT Business Solutions Manager</strong>,
            Marion South Office, DFR.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Header fields */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name of Person Completing</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={contactTitle}
                  onChange={e => setContactTitle(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Your Email (for your copy)</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          {QUESTIONS.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6">
              <p className="font-semibold text-slate-900 mb-4">
                <span className="text-brand-blue-600 mr-2">{q.id}.</span>
                {q.text}
              </p>

              {q.type === 'radio' && (
                <div className="flex gap-6">
                  {q.options!.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={opt}
                        checked={answers[`q${q.id}`] === opt}
                        onChange={() => setAnswer(`q${q.id}`, opt)}
                        className="accent-brand-blue-600"
                      />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'radio-expand' && (
                <div className="space-y-3">
                  <div className="flex gap-6">
                    {q.options!.map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={opt}
                          checked={answers[`q${q.id}`] === opt}
                          onChange={() => setAnswer(`q${q.id}`, opt)}
                          className="accent-brand-blue-600"
                        />
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                  {answers[`q${q.id}`] && q.followUps?.[answers[`q${q.id}`]] && (
                    <div className="mt-3">
                      <label className="block text-sm text-slate-600 mb-1">
                        {q.followUps[answers[`q${q.id}`]]}
                      </label>
                      <textarea
                        rows={3}
                        value={answers[`q${q.id}_followup`] || ''}
                        onChange={e => setAnswer(`q${q.id}_followup`, e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>
              )}

              {q.type === 'textarea' && (
                <textarea
                  rows={3}
                  value={answers[`q${q.id}`] || ''}
                  onChange={e => setAnswer(`q${q.id}`, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  placeholder={(q as { placeholder?: string }).placeholder || ''}
                  value={answers[`q${q.id}`] || ''}
                  onChange={e => setAnswer(`q${q.id}`, e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 print:hidden">
            <p className="text-xs text-slate-500 max-w-sm">
              Submitting sends a formatted copy to your email and notifies our team to forward to DFR.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-8 py-3 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : <><Send className="w-4 h-4" /> Submit &amp; Email Copy</>}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
