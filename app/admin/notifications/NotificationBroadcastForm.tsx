'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

type Audience = 'all-students' | 'active-students' | 'instructors' | 'admins';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'all-students',    label: 'All Students' },
  { value: 'active-students', label: 'Active Students Only' },
  { value: 'instructors',     label: 'Instructors' },
  { value: 'admins',          label: 'Admins' },
];

export default function NotificationBroadcastForm() {
  const [form, setForm] = useState({
    title: '',
    body: '',
    targetAudience: 'all-students' as Audience,
    url: '/lms',
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; sent?: number; failed?: number; error?: string } | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) setForm(f => ({ ...f, title: '', body: '' }));
    } catch {
      setResult({ success: false, error: 'Request failed' });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
          maxLength={80}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
        <textarea
          value={form.body}
          onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
          required
          rows={3}
          maxLength={200}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
        />
        <p className="text-[10px] text-slate-400 mt-1 text-right">{form.body.length}/200</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Audience</label>
          <select
            value={form.targetAudience}
            onChange={e => setForm(f => ({ ...f, targetAudience: e.target.value as Audience }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            {AUDIENCES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Link URL</label>
          <input
            type="text"
            value={form.url}
            onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-2 rounded-lg p-3 text-sm ${result.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {result.success
            ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span>
            {result.success
              ? `Sent to ${result.sent ?? 0} device${(result.sent ?? 0) !== 1 ? 's' : ''}${result.failed ? `, ${result.failed} failed` : ''}`
              : (result.error ?? 'Failed to send')}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={sending || !form.title.trim() || !form.body.trim()}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Sending…' : 'Send Notification'}
      </button>
    </form>
  );
}
