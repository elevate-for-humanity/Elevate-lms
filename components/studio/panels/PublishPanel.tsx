'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, RefreshCw, Rocket, ShieldCheck, XCircle } from 'lucide-react';
import { useCourse } from '../CourseProvider';
import { PanelHeader } from './BlueprintPanel';

interface PersistedAudit {
  pass: boolean;
  blocking_issues: string[];
  metrics: Record<string, unknown>;
}

export function PublishPanel() {
  const { state, updatePublishState, appendAIMemory } = useCourse();
  const { course, publishState } = state;
  const [audit, setAudit] = useState<PersistedAudit | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadAudit() {
    setError(null);
    try {
      const response = await fetch(`/api/admin/course-builder/audit?courseId=${encodeURIComponent(course.id)}`, { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.result) throw new Error(body.error || 'Unable to run persisted publication audit');
      setAudit(body.result);
    } catch (err) {
      setAudit(null);
      setError(err instanceof Error ? err.message : 'Unable to run persisted publication audit');
    }
  }

  useEffect(() => {
    void loadAudit();
  }, [course.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function rootAction(action: string, payload: Record<string, unknown>) {
    const response = await fetch('/api/admin/course-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.ok === false) {
      const blockers = Array.isArray(body.blocking_issues) ? body.blocking_issues : [];
      throw new Error(blockers.length ? blockers.join('\n') : body.error || `${action} failed`);
    }
    return body;
  }

  async function runReviewAction(kind: 'approve-lessons' | 'submit' | 'approve' | 'reject') {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      if (kind === 'approve-lessons') {
        const body = await rootAction('review-lessons', {
          review: { courseId: course.id, action: 'approve', allRequired: true, notes: notes || undefined },
        });
        setNotice(`Authenticated review recorded for ${body.review?.count ?? 'required'} lesson(s).`);
      } else {
        const body = await rootAction('review-course', {
          review: { courseId: course.id, action: kind, notes: notes || undefined },
        });
        updatePublishState({ reviewStatus: body.review?.review_status ?? kind });
        setNotice(`Course review state: ${body.review?.review_status ?? kind}.`);
      }
      await loadAudit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setBusy('');
    }
  }

  async function handlePublish() {
    setBusy('publish');
    setError(null);
    setNotice(null);
    try {
      const body = await rootAction('publish-persisted', {
        courseId: course.id,
        label: 'Course Studio authorized publication',
      });
      updatePublishState({ isPublished: true, publishedAt: new Date().toISOString(), reviewStatus: 'approved' });
      appendAIMemory({ role: 'action', content: `Course "${course.title}" published through the canonical Course Builder authority`, source: 'publish' });
      const { emitStudioEvent, STUDIO_EVENTS } = await import('@/lib/studio/events');
      emitStudioEvent(STUDIO_EVENTS.COURSE_PUBLISHED, { courseId: course.id });
      setNotice(`Published successfully${body.procurement_gate ? ' after the persisted procurement gate passed' : ''}.`);
      await loadAudit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setBusy('');
    }
  }

  const reviewStatus = String(audit?.metrics?.review_status ?? publishState.reviewStatus ?? 'draft');
  const approvedLessons = Number(audit?.metrics?.humanApprovedLessons ?? publishState.approvedLessons ?? 0);
  const totalLessons = Number(audit?.metrics?.lessons ?? publishState.totalLessons ?? 0);
  const auditPass = audit?.pass === true;

  return (
    <div className="p-6 max-w-3xl">
      <PanelHeader
        icon={<Rocket className="w-5 h-5" />}
        title="Review & Publish"
        subtitle={publishState.isPublished ? 'Published learner version' : 'Authorized human review and canonical publication'}
        actions={
          <button type="button" onClick={() => void loadAudit()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> Re-run gate
          </button>
        }
      />

      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-950">Persisted procurement/readiness gate</p>
            <p className="mt-1 text-xs text-slate-500">This is the same canonical evidence used by publication; local UI state cannot override it.</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${auditPass ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
            {auditPass ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {audit ? (auditPass ? 'PASS' : 'BLOCKED') : 'CHECKING'}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><div>Review state</div><div className="mt-1 font-bold text-slate-950">{reviewStatus}</div></div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><div>Required lesson approvals</div><div className="mt-1 font-bold text-slate-950">{approvedLessons}/{totalLessons}</div></div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><div>Review mode</div><div className="mt-1 font-bold text-slate-950">authorized human review</div></div>
        </div>

        {!auditPass && audit?.blocking_issues?.length ? (
          <ul className="mt-4 max-h-72 space-y-1 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            {audit.blocking_issues.map((issue) => <li key={issue}>• {issue}</li>)}
          </ul>
        ) : null}
      </div>

      {!publishState.isPublished ? (
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 font-bold text-violet-950"><ShieldCheck className="h-5 w-5" /> Human review workspace</div>
          <p className="mt-1 text-xs leading-5 text-violet-800">These controls write the authenticated reviewer identity and audit trail through the canonical Course Builder review service. Nothing here auto-approves AI output.</p>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={3}
            placeholder="Reviewer notes (optional)"
            className="mt-3 w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={Boolean(busy)} onClick={() => void runReviewAction('approve-lessons')} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 hover:bg-violet-100 disabled:opacity-50">{busy === 'approve-lessons' ? 'Recording…' : 'Approve required lessons'}</button>
            <button disabled={Boolean(busy) || reviewStatus === 'in_review' || reviewStatus === 'approved'} onClick={() => void runReviewAction('submit')} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 disabled:opacity-50">{busy === 'submit' ? 'Submitting…' : 'Submit course for review'}</button>
            <button disabled={Boolean(busy) || reviewStatus !== 'in_review'} onClick={() => void runReviewAction('approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{busy === 'approve' ? 'Approving…' : 'Approve course'}</button>
            <button disabled={Boolean(busy) || reviewStatus !== 'in_review'} onClick={() => void runReviewAction('reject')} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 hover:bg-red-100 disabled:opacity-50">{busy === 'reject' ? 'Rejecting…' : 'Reject / request revision'}</button>
          </div>
        </div>
      ) : null}

      {notice ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{notice}</div> : null}
      {error ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="whitespace-pre-wrap text-sm text-red-800">{error}</div>
        </div>
      ) : null}

      {publishState.isPublished ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Course is live</p>
            <p className="text-xs text-emerald-600">The learner version was published through the canonical Course Builder authority.</p>
          </div>
          <a href={`/lms/courses/${course.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900">View <ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      ) : (
        <button onClick={() => void handlePublish()} disabled={!auditPass || Boolean(busy)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
          {busy === 'publish' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Rocket className="h-5 w-5" />}
          {busy === 'publish' ? 'Publishing…' : auditPass ? 'Publish governed course' : 'Publication blocked by persisted gate'}
        </button>
      )}
    </div>
  );
}
