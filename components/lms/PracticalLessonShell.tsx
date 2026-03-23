'use client';

/**
 * PracticalLessonShell
 *
 * Learner-facing UI for practical lesson types:
 *   practicum, externship, clinical, observation, lab, assignment,
 *   simulation, capstone
 *
 * Shows:
 *   - Instructions and materials
 *   - Hours/attempts progress (for tracked types)
 *   - Evidence submission form
 *   - Review status
 *   - Skill signoff status
 *   - Completion gate (blocked until all requirements met)
 */

import { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, XCircle, RotateCcw, AlertCircle,
  Upload, FileText, ClipboardList, Award,
} from 'lucide-react';
import type { LessonRenderConfig } from '@/lib/lms/get-lesson-render-mode';
import { sanitizeRichHtml } from '@/lib/security/sanitize-html';
import { LESSON_TYPE_META } from '@/lib/curriculum/lesson-types';

interface EvidenceSubmission {
  id:              string;
  status:          'submitted' | 'under_review' | 'approved' | 'rejected' | 'revision_requested';
  submission_mode: string;
  body_text:       string | null;
  evaluator_notes: string | null;
  submitted_at:    string;
  reviewed_at:     string | null;
  attempt_number:  number;
}

interface PracticalProgress {
  accumulated_hours: number;
  approved_attempts: number;
  status:            string;
}

interface Props {
  lessonId:   string;
  courseId:   string;
  renderConfig: LessonRenderConfig;
  onComplete: () => void;
}

const STATUS_UI: Record<EvidenceSubmission['status'], { label: string; color: string; icon: React.ReactNode }> = {
  submitted:          { label: 'Submitted — awaiting review',  color: 'bg-brand-blue-50 border-brand-blue-200 text-brand-blue-700',  icon: <Clock className="w-4 h-4" /> },
  under_review:       { label: 'Under review',                 color: 'bg-amber-50 border-amber-200 text-amber-700',                 icon: <ClipboardList className="w-4 h-4" /> },
  approved:           { label: 'Approved',                     color: 'bg-green-50 border-green-200 text-green-700',                 icon: <CheckCircle2 className="w-4 h-4" /> },
  rejected:           { label: 'Not accepted',                 color: 'bg-red-50 border-red-200 text-red-700',                       icon: <XCircle className="w-4 h-4" /> },
  revision_requested: { label: 'Revision requested',           color: 'bg-orange-50 border-orange-200 text-orange-700',              icon: <RotateCcw className="w-4 h-4" /> },
};

export default function PracticalLessonShell({ lessonId, courseId, renderConfig, onComplete }: Props) {
  const { content, lessonType, requiresEvidence, requiresEvaluator, requiresSignoff, tracksPractical } = renderConfig;
  const meta = LESSON_TYPE_META[lessonType];

  const [evidence, setEvidence]         = useState<EvidenceSubmission | null>(null);
  const [progress, setProgress]         = useState<PracticalProgress | null>(null);
  const [practicalReq, setPracticalReq] = useState<any>(null);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [text, setText]                 = useState('');
  const [submitError, setSubmitError]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [evRes, progRes, reqRes] = await Promise.all([
          fetch(`/api/lms/evidence?course_id=${courseId}&lesson_id=${lessonId}`),
          tracksPractical ? fetch(`/api/lms/practical-progress?course_id=${courseId}&lesson_id=${lessonId}`) : Promise.resolve(null),
          fetch(`/api/lms/practical-requirements?lesson_id=${lessonId}`),
        ]);
        if (evRes.ok) {
          const { evidence: evList } = await evRes.json();
          if (evList?.length) setEvidence(evList[0]);
        }
        if (progRes?.ok) {
          const { progress: prog } = await progRes.json();
          if (prog) setProgress(prog);
        }
        if (reqRes.ok) {
          const { requirement } = await reqRes.json();
          if (requirement) setPracticalReq(requirement);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lessonId, courseId, tracksPractical]);

  const canResubmit = !evidence ||
    evidence.status === 'rejected' ||
    evidence.status === 'revision_requested';

  const isApproved = evidence?.status === 'approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { setSubmitError('Submission text is required.'); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/lms/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id:       lessonId,
          course_id:       courseId,
          submission_mode: 'text',
          body_text:       text.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Submission failed');
      }
      const { evidence: newEvidence } = await res.json();
      setEvidence(newEvidence);
      setText('');
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto p-8"><div className="h-48 bg-slate-100 rounded-xl animate-pulse" /></div>;
  }

  const requiredHours    = practicalReq?.required_hours ?? 0;
  const requiredAttempts = practicalReq?.required_attempts ?? 0;
  const accumulatedHours = progress?.accumulated_hours ?? 0;
  const approvedAttempts = progress?.approved_attempts ?? 0;

  const hoursComplete    = requiredHours === 0 || accumulatedHours >= requiredHours;
  const attemptsComplete = requiredAttempts === 0 || approvedAttempts >= requiredAttempts;
  const evidenceComplete = !requiresEvidence || isApproved;
  const allComplete      = hoursComplete && attemptsComplete && evidenceComplete;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className={`border rounded-xl p-6 ${meta.bgColor} ${meta.borderColor}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.bgColor}`}>
            <span className="text-xl">{meta.badge}</span>
          </div>
          <div>
            <div className={`text-xs font-semibold uppercase tracking-wide ${meta.color}`}>{meta.label}</div>
          </div>
        </div>

        {/* Instructions */}
        {(content.activityInstructions || practicalReq?.instructions) && (
          <div className="prose max-w-none mt-4"
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content.activityInstructions || practicalReq?.instructions || '') }} />
        )}

        {/* Materials */}
        {(content.materials?.length > 0 || practicalReq?.materials_needed?.length > 0) && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">Materials / Equipment Needed</p>
            <ul className="list-disc list-inside space-y-1">
              {(content.materials?.length > 0 ? content.materials : practicalReq?.materials_needed ?? []).map((m: string, i: number) => (
                <li key={i} className="text-sm text-slate-600">{m}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Safety guidance */}
        {practicalReq?.safety_guidance && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-800 mb-1">⚠ Safety Guidance</p>
            <p className="text-sm text-amber-700">{practicalReq.safety_guidance}</p>
          </div>
        )}
      </div>

      {/* Progress tracking (hours/attempts) */}
      {tracksPractical && (requiredHours > 0 || requiredAttempts > 0) && (
        <div className="border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Progress Tracking</p>
          <div className="grid grid-cols-2 gap-4">
            {requiredHours > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Hours Completed</p>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl font-bold ${hoursComplete ? 'text-green-600' : 'text-slate-800'}`}>{accumulatedHours}</span>
                  <span className="text-sm text-slate-400 mb-0.5">/ {requiredHours} required</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                  <div className={`h-2 rounded-full transition-all ${hoursComplete ? 'bg-green-500' : 'bg-brand-blue-500'}`}
                    style={{ width: `${Math.min(100, (accumulatedHours / requiredHours) * 100)}%` }} />
                </div>
              </div>
            )}
            {requiredAttempts > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Approved Attempts</p>
                <div className="flex items-end gap-1">
                  <span className={`text-2xl font-bold ${attemptsComplete ? 'text-green-600' : 'text-slate-800'}`}>{approvedAttempts}</span>
                  <span className="text-sm text-slate-400 mb-0.5">/ {requiredAttempts} required</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evidence submission */}
      {requiresEvidence && (
        <div className="border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-slate-700 mb-3">Evidence Submission</p>

          {/* Prior submission status */}
          {evidence && (
            <div className={`flex items-start gap-3 p-3 rounded-lg border mb-4 ${STATUS_UI[evidence.status].color}`}>
              {STATUS_UI[evidence.status].icon}
              <div className="flex-1">
                <p className="text-sm font-semibold">{STATUS_UI[evidence.status].label}</p>
                {evidence.evaluator_notes && (
                  <p className="text-sm mt-1 opacity-80">{evidence.evaluator_notes}</p>
                )}
                <p className="text-xs opacity-60 mt-1">
                  Submitted {new Date(evidence.submitted_at).toLocaleDateString()}
                  {evidence.reviewed_at && ` · Reviewed ${new Date(evidence.reviewed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          )}

          {/* Submission form */}
          {canResubmit && (
            <form onSubmit={handleSubmit} className="space-y-3">
              {evidence?.status === 'revision_requested' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                  Revision requested. Please address the evaluator's feedback and resubmit.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {content.evidence?.instructions || 'Describe your work and what you completed:'}
                </label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={5}
                  placeholder="Describe what you did, what you observed, and what you learned..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
                />
              </div>
              {submitError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />{submitError}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                {submitting ? 'Submitting...' : evidence ? 'Resubmit Evidence' : 'Submit Evidence'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Completion gate */}
      <div className={`border rounded-xl p-4 ${allComplete ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
        <p className="text-sm font-semibold text-slate-700 mb-3">Completion Requirements</p>
        <div className="space-y-2">
          {requiredHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {hoursComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
              <span className={hoursComplete ? 'text-green-700' : 'text-slate-600'}>
                {requiredHours} hours completed ({accumulatedHours} / {requiredHours})
              </span>
            </div>
          )}
          {requiredAttempts > 0 && (
            <div className="flex items-center gap-2 text-sm">
              {attemptsComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
              <span className={attemptsComplete ? 'text-green-700' : 'text-slate-600'}>
                {requiredAttempts} approved attempts ({approvedAttempts} / {requiredAttempts})
              </span>
            </div>
          )}
          {requiresEvidence && (
            <div className="flex items-center gap-2 text-sm">
              {evidenceComplete ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
              <span className={evidenceComplete ? 'text-green-700' : 'text-slate-600'}>
                Evidence {requiresEvaluator ? 'approved by evaluator' : 'submitted'}
              </span>
            </div>
          )}
        </div>

        {allComplete && (
          <button
            type="button"
            onClick={onComplete}
            className="mt-4 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            <Award className="w-4 h-4" />
            Mark Complete
          </button>
        )}
        {!allComplete && (
          <p className="mt-3 text-xs text-slate-500">
            Complete all requirements above before this lesson can be marked complete.
          </p>
        )}
      </div>
    </div>
  );
}
