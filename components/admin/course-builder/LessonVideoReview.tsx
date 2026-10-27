'use client';

import { useState } from 'react';

type Review = {
  artifactVersionId: string;
  version: number;
  decision: string;
  comment?: string | null;
};

export default function LessonVideoReview({ buildId, lessonBuildId, review, onSaved }: {
  buildId: string;
  lessonBuildId: string;
  review: Review;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(review.comment ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save(action: 'approve' | 'request_change') {
    if (busy || (action === 'request_change' && !comment.trim())) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/admin/ultimate-course-builder/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildId, lessonBuildId, artifactVersionId: review.artifactVersionId,
          action, ...(action === 'request_change' ? { comment: comment.trim() } : {}) }),
        signal: AbortSignal.timeout(25000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'The video review could not be saved.');
      setMessage(result.message || 'Review saved for this video version.');
      setEditing(false);
      onSaved();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The video review could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="rounded-lg border border-cyan-700 p-3">
    <p>Video version {review.version} · Review: {review.decision.replaceAll('_', ' ')}</p>
    <p className="mt-1 text-xs text-slate-300">Review applies only to this saved video. Publishing still requires the course quality checks.</p>
    {review.decision === 'request_change' && <div className="mt-2 rounded-lg border border-amber-500 p-3">
      <p>Changes requested for this version. This review does not schedule a repair.</p>
      {review.comment && <p className="mt-2 whitespace-pre-wrap">{review.comment}</p>}
    </div>}
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" disabled={busy || editing || review.decision === 'approve'}
        onClick={() => void save('approve')}
        className="min-h-11 rounded-lg bg-emerald-500 px-3 font-bold text-slate-950 disabled:opacity-50">
        {review.decision === 'approve' ? 'Video version approved' : busy ? 'Saving review…' : 'Approve this video version'}
      </button>
      <button type="button" disabled={busy} onClick={() => { setEditing(true); setError(''); setMessage(''); }}
        className="min-h-11 rounded-lg border border-amber-500 px-3">
        {review.decision === 'request_change' ? 'Edit change request' : 'Request changes'}
      </button>
    </div>
    {editing && <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); void save('request_change'); }}>
      <label className="block font-bold">What needs to change?
        <textarea required maxLength={4000} value={comment} disabled={busy}
          onChange={(event) => setComment(event.target.value)} rows={4}
          className="mt-2 block w-full rounded-lg border border-slate-400 bg-slate-900 p-3 text-white"
          placeholder="Describe the missing pictures, incorrect instruction, or video issue." />
      </label>
      <p className="text-sm text-slate-300">Your notes will be saved against video version {review.version}. They do not start rendering or change a published lesson.</p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !comment.trim()} className="min-h-11 rounded-lg bg-amber-400 px-3 font-bold text-slate-950 disabled:opacity-50">{busy ? 'Saving request…' : 'Save change request'}</button>
        <button type="button" disabled={busy} onClick={() => setEditing(false)} className="min-h-11 rounded-lg border border-slate-400 px-3">Cancel</button>
      </div>
    </form>}
    {message && <p role="status" className="mt-2">{message}</p>}
    {error && <p role="alert" className="mt-2 text-amber-200">{error}</p>}
  </div>;
}
