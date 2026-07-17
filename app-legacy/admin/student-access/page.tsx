'use client';

import { useState } from 'react';

type DiagnosticResult = {
  success: boolean;
  code: string;
  message: string;
  diagnostics?: string[];
  student?: Record<string, unknown>;
  enrollment?: Record<string, unknown>;
  authUser?: Record<string, unknown>;
  actions?: string[];
  error?: string;
};

export default function StudentAccessDebugger() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'check' | 'repair'>('check');

  async function run() {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/student-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), repair: mode === 'repair' }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        success: false,
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'Request failed',
      });
    } finally {
      setLoading(false);
    }
  }

  const statusColor = result
    ? result.success
      ? 'text-green-700 bg-green-50 border-green-200'
      : 'text-red-700 bg-red-50 border-red-200'
    : '';

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Student Portal Diagnostics</h1>
        <p className="text-sm text-gray-500 mt-1">
          Validate or repair a student&apos;s portal access state.
        </p>
      </div>

      <div className="space-y-3">
        <input
          className="border border-gray-300 p-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-black"
          placeholder="student@email.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
        />

        <div className="flex gap-3">
          <button
            onClick={() => { setMode('check'); run(); }}
            disabled={loading || !email.trim()}
            className="px-5 py-2.5 bg-black text-white rounded disabled:opacity-40 text-sm font-medium"
          >
            {loading && mode === 'check' ? 'Checking…' : 'Run Diagnostics'}
          </button>
          <button
            onClick={() => { setMode('repair'); run(); }}
            disabled={loading || !email.trim()}
            className="px-5 py-2.5 bg-red-600 text-white rounded disabled:opacity-40 text-sm font-medium"
          >
            {loading && mode === 'repair' ? 'Repairing…' : 'Auto-Repair'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`border rounded p-4 space-y-4 ${statusColor}`}>
          <div>
            <span className="font-mono text-xs font-bold">{result.code}</span>
            <p className="mt-1 font-medium">{result.message}</p>
          </div>

          {result.diagnostics && result.diagnostics.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">Steps</p>
              <ul className="text-sm space-y-0.5 list-disc list-inside">
                {result.diagnostics.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {result.actions && result.actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1">Actions Taken</p>
              <ul className="text-sm space-y-0.5 list-disc list-inside">
                {result.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          {(result.student || result.enrollment || result.authUser) && (
            <details className="text-xs">
              <summary className="cursor-pointer font-semibold">Raw data</summary>
              <pre className="mt-2 bg-white/60 p-3 rounded overflow-auto">
                {JSON.stringify(
                  { student: result.student, authUser: result.authUser, enrollment: result.enrollment },
                  null,
                  2,
                )}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
