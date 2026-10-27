'use client';

import { FormEvent, useState } from 'react';

type Result = {
  success?: boolean;
  provider?: string;
  email?: string;
  messageId?: string | null;
  error?: string;
};

export default function ProgramHolderResetLoginPage() {
  const [holderId, setHolderId] = useState('');
  const [expectedUserId, setExpectedUserId] = useState('');
  const [expectedEmail, setExpectedEmail] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== 'RESET-PORTAL-PASSWORD') return;

    setSubmitting(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/program-holders/reset-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holderId, expectedUserId, expectedEmail }),
      });
      const payload = (await response.json()) as Result;
      setResult(response.ok ? payload : { error: payload.error || 'Reset failed' });
    } catch {
      setResult({ error: 'Could not reach the reset service' });
    } finally {
      setSubmitting(false);
    }
  }

  const confirmed = confirmation === 'RESET-PORTAL-PASSWORD';

  return (
    <main className="mx-auto max-w-2xl p-6 md:p-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Admin operation</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Reset program-holder login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Generates a permanent password, verifies the Supabase login, and delivers it through
          Elevate&apos;s production SendGrid account. The password is never displayed or logged.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-slate-800">
            Program-holder record ID
            <input
              required
              value={holderId}
              onChange={(event) => setHolderId(event.target.value.trim())}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Expected Auth user ID
            <input
              required
              value={expectedUserId}
              onChange={(event) => setExpectedUserId(event.target.value.trim())}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Expected account email
            <input
              required
              type="email"
              value={expectedEmail}
              onChange={(event) => setExpectedEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Type RESET-PORTAL-PASSWORD to confirm
            <input
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
              autoComplete="off"
            />
          </label>

          <button
            type="submit"
            disabled={!confirmed || submitting}
            className="w-full rounded-lg bg-red-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {submitting ? 'Resetting and sending…' : 'Reset, verify, and email credentials'}
          </button>
        </form>

        {result?.success && (
          <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
            Login verified and accepted by {result.provider} for {result.email}.
            {result.messageId ? ` Message ID: ${result.messageId}` : ''}
          </div>
        )}
        {result?.error && (
          <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
            {result.error}
          </div>
        )}
      </div>
    </main>
  );
}
