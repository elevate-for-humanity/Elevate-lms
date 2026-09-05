'use client';

import { useState } from 'react';

export function AlumniCareerOutreachButton({ count }: { count: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function send() {
    setBusy(true);
    setMessage('');
    const response = await fetch('/api/program-holder/alumni-career-outreach', { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(
      response.ok
        ? `${result.sent} graduate portal emails sent.`
        : result.error || 'Graduate emails could not be sent.',
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={send}
        disabled={busy || count === 0}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Sending…' : `Email graduate portal steps (${count})`}
      </button>
      {message && <p role="status" className="mt-2 text-xs font-bold text-slate-700">{message}</p>}
    </div>
  );
}
