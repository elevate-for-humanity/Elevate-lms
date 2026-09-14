'use client';

import { useState } from 'react';

export function StudentReadyForTestingButton({
  studentId,
  studentName,
  source,
}: {
  studentId: string;
  studentName: string;
  source: 'enrollment' | 'holder_student';
}) {
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function notifyAdmin() {
    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/program-holder/student-testing-readiness', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId, source }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to alert Admin.');
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to alert Admin.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={saving || sent}
        onClick={notifyAdmin}
        aria-label={`Mark ${studentName} completed and ready to test`}
        className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-60"
      >
        {saving
          ? 'Alerting Admin…'
          : sent
            ? 'Admin alerted'
            : 'Student completed — ready to test'}
      </button>
      {error ? <p className="mt-1 max-w-56 text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
