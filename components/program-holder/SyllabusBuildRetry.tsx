'use client';
import { useEffect, useState } from 'react';
export default function SyllabusBuildRetry({ documentId, needsProgram = false }: { documentId: string; needsProgram?: boolean }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [programs, setPrograms] = useState<Array<{id: string; title?: string; name?: string}>>([]);
  const [programId, setProgramId] = useState(''), [sourceText, setSourceText] = useState('');
  useEffect(() => {
    if (!needsProgram) return;
    const controller = new AbortController();
    fetch('/api/program-holder/syllabus', {signal: controller.signal}).then(response => response.json()).then(result => {
      if (!Array.isArray(result.programs)) throw new Error(result.error || 'Assigned programs unavailable.');
      setPrograms(result.programs);
      if (result.programs.length === 1) setProgramId(result.programs[0].id);
    }).catch(error => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, [needsProgram]);
  async function retry() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/program-holder/syllabus', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId, programId, syllabusText: sourceText }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Build could not start.');
      setMessage(result.alreadyPublished ? 'This secondary course is already published.' : 'Course Builder started. Refresh this page to view saved progress.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Build could not start.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-3 space-y-3">
    {needsProgram && <>
      <label className="grid gap-1 text-sm font-bold">Program for this saved syllabus
        <select value={programId} onChange={event => setProgramId(event.target.value)} disabled={busy} className="min-h-11 rounded-lg border p-2">
          <option value="">Choose your assigned program</option>
          {programs.map(program => <option key={program.id} value={program.id}>{program.title || program.name || 'Assigned program'}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold">Syllabus text if the saved file cannot be read (optional)
        <textarea value={sourceText} onChange={event => setSourceText(event.target.value)} maxLength={250000} rows={4} className="rounded-lg border p-2" />
      </label>
    </>}
    <button type="button" disabled={busy || (needsProgram && !programId)} onClick={retry} className="min-h-11 rounded-lg border px-4 py-2 font-bold disabled:opacity-50">
      {busy ? 'Starting…' : needsProgram ? 'Build secondary course from saved syllabus' : 'Retry syllabus build'}
    </button>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </div>;
}
