'use client';

import { useState } from 'react';

const ACTIVITY_TYPES = [
  { value: 'on_the_job_training', label: 'On-the-Job Training' },
  { value: 'haircut_techniques', label: 'Haircut Techniques (clipper, shear, fade)' },
  { value: 'razor_shaving', label: 'Razor & Shaving Services' },
  { value: 'sanitation_safety', label: 'Sanitation & Safety' },
  { value: 'client_consultation', label: 'Client Consultation & Service' },
  { value: 'shop_operations', label: 'Shop Operations & Maintenance' },
];

interface LogEntry {
  id: string;
  log_date: string;
  hours: number;
  minutes: number;
  total_minutes: number;
  description: string;
  activity_type: string;
  status: 'pending' | 'verified';
}

interface Summary {
  total_hours: number;
  total_minutes: number;
  verified_hours: number;
  verified_minutes: number;
  pending_count: number;
}

export function OjtDigitalLogger() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('0');
  const [description, setDescription] = useState('');
  const [activityType, setActivityType] = useState('on_the_job_training');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/ojt/hours');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setSummary(data.summary ?? null);
      }
    } finally {
      setLoadingLogs(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/ojt/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          hours: parseInt(hours) || 0,
          minutes: parseInt(minutes) || 0,
          description,
          activity_type: activityType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Failed to log hours' });
        return;
      }

      setMessage({
        type: 'success',
        text: `${data.message}${data.points_awarded ? ` · +${data.points_awarded} pts` : ''}`,
      });
      setHours('');
      setMinutes('0');
      setDescription('');
      // Refresh log if visible
      if (logs !== null) fetchLogs();
    } catch {
      setMessage({ type: 'error', text: 'Network error — try again' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-brand-blue-600 rounded-xl p-6 mb-8 bg-blue-50 print:hidden">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Digital OJT Hours Submission</h2>
      <p className="text-sm text-slate-600 mb-4">
        Log hours digitally for LMS tracking. Use the print form below for supervisor signatures.
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Activity Type</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Hours</label>
          <input
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Minutes</label>
          <select
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Skills Practiced / Tasks Performed
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Describe the skills practiced or tasks performed during this session"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500 resize-none"
          />
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700 disabled:opacity-50 transition"
          >
            {submitting ? 'Logging…' : 'Log Hours'}
          </button>

          <button
            type="button"
            onClick={() => { if (logs === null) fetchLogs(); else setLogs(null); }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-white transition"
          >
            {logs !== null ? 'Hide History' : 'View My Hours'}
          </button>

          {message && (
            <p className={`text-sm font-medium ${message.type === 'success' ? 'text-brand-green-700' : 'text-red-600'}`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </p>
          )}
        </div>
      </form>

      {/* Hours history */}
      {logs !== null && (
        <div className="mt-5 border-t pt-4">
          {summary && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xs text-slate-500">Total Logged</p>
                <p className="text-xl font-bold text-slate-900">
                  {summary.total_hours}h {summary.total_minutes}m
                </p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xs text-slate-500">Verified</p>
                <p className="text-xl font-bold text-brand-green-700">
                  {summary.verified_hours}h {summary.verified_minutes}m
                </p>
              </div>
              <div className="bg-white rounded-lg border p-3 text-center">
                <p className="text-xs text-slate-500">Required</p>
                <p className="text-xl font-bold text-slate-900">1,500h</p>
              </div>
            </div>
          )}

          {loadingLogs ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500">No hours logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="p-2 border font-medium">Date</th>
                    <th className="p-2 border font-medium">Hours</th>
                    <th className="p-2 border font-medium">Activity</th>
                    <th className="p-2 border font-medium">Description</th>
                    <th className="p-2 border font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2 border">{log.log_date}</td>
                      <td className="p-2 border whitespace-nowrap">
                        {log.hours}h {log.minutes}m
                      </td>
                      <td className="p-2 border">
                        {ACTIVITY_TYPES.find((t) => t.value === log.activity_type)?.label ?? log.activity_type}
                      </td>
                      <td className="p-2 border text-slate-600 max-w-xs truncate">{log.description || '—'}</td>
                      <td className="p-2 border">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'verified'
                            ? 'bg-brand-green-100 text-brand-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
