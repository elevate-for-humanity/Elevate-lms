'use client';

/**
 * StepSubmissionForm
 *
 * Learner-facing submission form for lab and assignment step types.
 * Writes to POST /api/lms/submissions.
 * Shows prior submission status if one exists.
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, XCircle, RotateCcw, Send, ClipboardList } from 'lucide-react';

interface Submission {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  submission_text: string | null;
  instructor_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface Props {
  lessonId: string;
  courseId: string;
  stepType: 'lab' | 'assignment';
  lessonTitle: string;
}

const STATUS_UI: Record<Submission['status'], { label: string; color: string; icon: React.ReactNode }> = {
  submitted:          { label: 'Submitted — awaiting review',  color: 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-700',  icon: <Clock className="w-4 h-4" /> },
  under_review:       { label: 'Under review',                 color: 'bg-amber-50 border-amber-200 text-amber-700',                 icon: <ClipboardList className="w-4 h-4" /> },
  approved:           { label: 'Approved',                     color: 'bg-green-50 border-green-200 text-green-700',                 icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected:           { label: 'Not accepted',                 color: 'bg-red-50 border-red-200 text-red-700',                       icon: <XCircle className="w-4 h-4" /> },
  revision_requested: { label: 'Revision requested',           color: 'bg-orange-50 border-orange-200 text-orange-700',              icon: <RotateCcw className="w-4 h-4" /> },
};

export default function StepSubmissionForm({ lessonId, courseId, stepType, lessonTitle }: Props) {
  const [prior, setPrior] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function loadPrior() {
      try {
        const res = await fetch(
          `/api/lms/submissions?course_id=${courseId}&lesson_id=${lessonId}`
        );
        if (res.ok) {
          const { submissions } = await res.json();
          if (submissions?.length > 0) setPrior(submissions[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadPrior();
  }, [lessonId, courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) { setError('Submission text is required.'); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/lms/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id:       lessonId,
        course_id:       courseId,
        step_type:       stepType,
        submission_text: text.trim(),
      }),
    });

    if (res.ok) {
      const { submission } = await res.json();
      setPrior(submission);
      setSubmitted(true);
      setText('');
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  }

  if (loading) return null;

  const canResubmit = prior?.status === 'revision_requested' || prior?.status === 'rejected';
  const isTerminal  = prior?.status === 'approved';
  const isPending   = prior && !canResubmit && !isTerminal;

  return (
    <div className="mt-6 space-y-4">
      {/* Prior submission status */}
      {prior && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${STATUS_UI[prior.status].color}`}>
          <span className="mt-0.5 shrink-0">{STATUS_UI[prior.status].icon}</span>
          <div className="min-w-0">
            <p className="font-semibold text-sm">{STATUS_UI[prior.status].label}</p>
            {prior.instructor_note && (
              <p className="text-sm mt-1 opacity-90">
                <span className="font-medium">Instructor note:</span> {prior.instructor_note}
              </p>
            )}
            {prior.reviewed_at && (
              <p className="text-xs mt-1 opacity-70">
                Reviewed {new Date(prior.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success banner */}
      {submitted && !canResubmit && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Submitted successfully. Your instructor will review it shortly.
        </div>
      )}

      {/* Submission form — show when no prior, or revision requested, or rejected */}
      {(!prior || canResubmit) && !submitted && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {canResubmit ? 'Revised submission' : `Your ${stepType === 'lab' ? 'lab report' : 'assignment'}`}
            </span>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder={
                stepType === 'lab'
                  ? 'Describe what you did, what you observed, and what you learned…'
                  : 'Write your response here…'
              }
              className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue-500 focus:outline-none focus:ring-1 focus:ring-brand-blue-500 resize-y"
              disabled={submitting}
            />
          </label>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting…' : canResubmit ? 'Resubmit' : 'Submit for review'}
          </button>
        </form>
      )}

      {/* Approved — no further action */}
      {isTerminal && (
        <p className="text-sm text-slate-500">
          This {stepType} has been approved. No further action required.
        </p>
      )}

      {/* Pending — waiting */}
      {isPending && !submitted && (
        <p className="text-sm text-slate-500">
          Your submission is with your instructor. You will be notified when it is reviewed.
        </p>
      )}
    </div>
  );
}
