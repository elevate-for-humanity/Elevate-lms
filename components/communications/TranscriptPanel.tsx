'use client';
import { useState } from 'react';
export function TranscriptPanel({
  text,
  summary,
  transcribeUrl,
}: {
  text?: string | null;
  summary?: string | null;
  transcribeUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const [generated, setGenerated] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function generate() {
    if (!transcribeUrl) return;
    setBusy(true);
    setError('');
    try {
      const r = await fetch(transcribeUrl, { method: 'POST' }),
        data = await r.json();
      if (!r.ok) throw Error(data.error || 'Transcription unavailable');
      setGenerated(data.transcript);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription unavailable');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="min-h-11 font-black text-blue-800"
      >
        {open ? 'Hide transcript' : 'Read transcript'}
      </button>
      <div
        hidden={!open}
        className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800"
      >
        {text ||
          generated ||
          (summary
            ? `Summary (full transcript unavailable):\n${summary}`
            : 'A transcript has not been generated for this recording. You can listen to the audio when available.')}
      </div>
      {open && !text && !generated && transcribeUrl && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void generate()}
          className="mt-2 min-h-11 rounded-lg border px-3 font-bold text-blue-800"
        >
          {busy ? 'Generating transcript…' : 'Generate transcript'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
