'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
}

export function AtRiskActions({ studentId, enrollmentId, studentName, studentEmail }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'sent' | 'flagged' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleFollowUp() {
    setStatus('idle');
    startTransition(async () => {
      const res = await fetch('/api/admin/at-risk/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, enrollmentId }),
      });
      if (res.ok) {
        setStatus('sent');
        setMessage('Follow-up sent');
      } else {
        const body = await res.json().catch(() => null);
        setStatus('error');
        setMessage(body?.error ?? 'Failed to send');
      }
    });
  }

  async function handleFlag() {
    setStatus('idle');
    startTransition(async () => {
      const res = await fetch('/api/admin/at-risk/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, enrollmentId }),
      });
      if (res.ok) {
        setStatus('flagged');
        setMessage('Flagged for review');
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        setStatus('error');
        setMessage(body?.error ?? 'Failed to flag');
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <a
        href={`/admin/students/${studentId}`}
        className="px-3 py-1.5 bg-brand-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-blue-700 text-center"
      >
        View Details
      </a>
      {studentEmail && (
        <button
          type="button"
          onClick={handleFollowUp}
          disabled={pending || status === 'sent'}
          className="px-3 py-1.5 bg-brand-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-brand-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending && status === 'idle' ? 'Sending…' : status === 'sent' ? '✓ Sent' : 'Send Follow-up'}
        </button>
      )}
      <button
        type="button"
        onClick={handleFlag}
        disabled={pending || status === 'flagged'}
        className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'flagged' ? '✓ Flagged' : 'Flag for Review'}
      </button>
      {message && (
        <span className={`text-xs ${status === 'error' ? 'text-brand-red-600' : 'text-brand-green-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}
