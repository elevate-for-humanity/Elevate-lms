'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImpersonateForm() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!userId.trim()) { setError('User ID is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId.trim(), reason: reason.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to start impersonation'); return; }
      setSuccess(`Now viewing as: ${data.impersonating.name} (${data.impersonating.email}). Session expires ${new Date(data.impersonating.expires_at).toLocaleTimeString()}.`);
      router.refresh();
    } catch {
      setError('Request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    setLoading(true);
    setError('');
    try {
      await fetch('/api/admin/impersonate', { method: 'DELETE' });
      setSuccess('');
      setUserId('');
      setReason('');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="font-bold text-slate-900 mb-4">Start Impersonation Session</h2>
      <form onSubmit={handleStart} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Target User ID <span className="text-brand-red-500">*</span>
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID from profiles table"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason <span className="text-slate-400 font-normal">(recommended)</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Support ticket #1234 — learner cannot see enrollment"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
          />
        </div>
        {error && <p className="text-brand-red-600 text-sm">{error}</p>}
        {success && (
          <div className="bg-brand-green-50 border border-brand-green-200 rounded-lg p-3">
            <p className="text-brand-green-700 text-sm font-medium">{success}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-brand-red-700 disabled:opacity-50 transition"
          >
            {loading ? 'Starting…' : 'Start Session'}
          </button>
          {success && (
            <button
              type="button"
              onClick={handleEnd}
              disabled={loading}
              className="border border-slate-300 text-slate-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 disabled:opacity-50 transition"
            >
              End Session
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
