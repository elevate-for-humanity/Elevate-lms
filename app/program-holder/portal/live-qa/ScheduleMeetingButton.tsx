'use client';

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';

export function ScheduleMeetingButton() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', scheduled_at: '', duration_minutes: '60', meeting_url: '' });

  function update(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.scheduled_at) { setError('Title and date are required'); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, duration_minutes: parseInt(form.duration_minutes) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? 'Failed to schedule meeting'); return; }
      setSuccess(true); setOpen(false);
      setForm({ title: '', scheduled_at: '', duration_minutes: '60', meeting_url: '' });
    } catch { setError('Network error — try again'); }
    finally { setSubmitting(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
        <Plus className="w-4 h-4" /> Schedule Session
      </button>
      {success && <p className="text-xs text-brand-green-700 font-medium mt-1">✅ Session scheduled</p>}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Schedule Live Session</h2>
              <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} required placeholder="e.g. EPA 608 Q&A Session" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={(e) => update('scheduled_at', e.target.value)} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                <select value={form.duration_minutes} onChange={(e) => update('duration_minutes', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                  {[30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting URL (optional)</label>
                <input type="url" value={form.meeting_url} onChange={(e) => update('meeting_url', e.target.value)} placeholder="https://zoom.us/j/..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-brand-blue-600 hover:bg-brand-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}{submitting ? 'Scheduling…' : 'Schedule'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
