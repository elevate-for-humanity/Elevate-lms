'use client';

import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

type ExportType = 'registrations' | 'progress' | 'completions' | 'cancellations';

const EXPORT_TYPES: { value: ExportType; label: string; desc: string }[] = [
  { value: 'registrations', label: 'New Registrations', desc: 'Apprentices registered but not yet submitted to RAPIDS' },
  { value: 'progress',      label: 'Progress Updates',  desc: 'OJT hours logged since last submission' },
  { value: 'completions',   label: 'Completions',       desc: 'Apprentices who completed their program' },
  { value: 'cancellations', label: 'Cancellations',     desc: 'Apprentices who withdrew or were cancelled' },
];

export default function RapidsExportClient() {
  const [type, setType] = useState<ExportType>('registrations');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const params = new URLSearchParams({ type, format: 'csv' });
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const res = await fetch(`/api/admin/rapids/export?${params}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapids_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      // Also get count via JSON
      const jsonRes = await fetch(`/api/admin/rapids/export?${params}&format=json`);
      if (jsonRes.ok) {
        const d = await jsonRes.json();
        setResult({ count: d.count, errors: d.errors ?? [] });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="font-semibold text-slate-800">Generate Export</h2>

      {/* Type selector */}
      <div className="grid sm:grid-cols-2 gap-3">
        {EXPORT_TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`text-left p-4 rounded-xl border-2 transition-all ${
              type === t.value
                ? 'border-brand-blue-500 bg-brand-blue-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}>
            <p className={`text-sm font-semibold ${type === t.value ? 'text-brand-blue-700' : 'text-slate-700'}`}>{t.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Date range */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Start Date (optional)</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">End Date (optional)</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400" />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Exported {result.count} records.
          {result.errors.length > 0 && <span className="text-amber-700 ml-2">{result.errors.length} warnings.</span>}
        </div>
      )}

      <button onClick={exportCsv} disabled={loading}
        className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {loading ? 'Generating…' : 'Download CSV'}
      </button>
    </div>
  );
}
