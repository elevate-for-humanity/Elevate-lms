'use client';
import { useEffect, useState } from 'react';

/** Existing practical-review API surfaced inside the instructor review area. */
export default function CoursePracticalReviewQueue() {
  const [rows, setRows] = useState<any[]>([]), [error, setError] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState('');
  async function load() {
    const response = await fetch('/api/admin/course-builder/practical-reviews', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load practical reviews');
    setRows(data.submissions);
  }
  useEffect(() => { void load().catch(cause => setError(cause.message)); }, []);
  async function review(row: any, decision: string) {
    setSaving(row.id); setError('');
    try {
      const response = await fetch('/api/admin/course-builder/practical-reviews', { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionId: row.id, decision, comments: notes[row.id] || '',
          competencyResults: Object.fromEntries(row.competency_keys.map((key: string) => [key, checks[`${row.id}:${key}`] === true])) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Review could not be saved');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Review failed'); }
    finally { setSaving(''); }
  }
  return <section className="my-6 rounded border p-4" aria-label="Hands-on practical reviews">
    <h2 className="text-lg font-semibold">Hands-on practical reviews</h2>
    <p>Review the learner’s evidence and confirm each demonstrated competency before approving.</p>
    {error ? <p role="alert">{error}</p> : null}
    {!rows.length && !error ? <p>No practical submissions awaiting your review.</p> : null}
    {rows.map(row => <article key={row.id} className="my-4 rounded border p-4">
      <h3 className="font-semibold">{row.interaction_id}</h3><p>Learner: {row.learner_id}</p>
      {(row.evidence ?? []).map((item: any, index: number) => <p key={index} className="whitespace-pre-wrap break-words">{item.type === 'text' ? item.value : /^https:\/\//i.test(item.value) ? <a href={item.value} target="_blank" rel="noreferrer">Open submitted evidence</a> : item.value}</p>)}
      {row.competency_keys.map((key: string) => <label key={key} className="my-2 block"><input type="checkbox" checked={checks[`${row.id}:${key}`] === true} onChange={event => setChecks({ ...checks, [`${row.id}:${key}`]: event.target.checked })} /> Observed and verified: {key}</label>)}
      <label className="block">Review comments<textarea className="block w-full rounded border p-2" value={notes[row.id] || ''} onChange={event => setNotes({ ...notes, [row.id]: event.target.value })} /></label>
      <div className="mt-3 flex flex-wrap gap-3">{[['approved','Approve'],['revision_required','Request revision'],['rejected','Reject']].map(([decision,label]) => <button key={decision} className="rounded border px-3 py-2" disabled={saving === row.id || (notes[row.id] || '').trim().length < 3 || decision === 'approved' && row.competency_keys.some((key: string) => checks[`${row.id}:${key}`] !== true)} onClick={() => { void review(row, decision); }}>{label}</button>)}</div>
    </article>)}
  </section>;
}
