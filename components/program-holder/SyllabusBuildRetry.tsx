'use client';
import { useState } from 'react';
export default function SyllabusBuildRetry({ documentId }: { documentId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function retry() {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/program-holder/syllabus', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Build could not start.');
      setMessage('Course Builder started. Refresh this page to view saved progress.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Build could not start.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-3">
    <button type="button" disabled={busy} onClick={retry} className="min-h-11 rounded-lg border px-4 py-2 font-bold disabled:opacity-50">
      {busy ? 'Starting…' : 'Retry syllabus build'}
    </button>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </div>;
}
