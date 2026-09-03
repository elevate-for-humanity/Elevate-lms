'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Zap, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

type FeedStats = {
  total: number;
  lastImport: string | null;
  configured: {
    usajobs: boolean;
    careeronestop: boolean;
  };
};

export function JobBoardPanel() {
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    fetch('/api/jobs/government-feed')
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        return json;
      })
      .then((json) => { setStats(json); setError(''); })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load job feed status'))
      .finally(() => setLoading(false));
  }, []);

  async function runImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/jobs/government-feed', { method: 'POST' });
      const data = await res.json();
      setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 });
      // Refresh stats
      const updated = await fetch('/api/jobs/government-feed').then((r) => r.json());
      setStats(updated);
    } catch {
      setImportResult({ imported: 0, skipped: -1 });
    } finally {
      setImporting(false);
    }
  }

  const sources = [
    { key: 'usajobs' as const, label: 'USAJobs.gov', href: 'https://developer.usajobs.gov', note: 'Federal jobs API' },
    { key: 'careeronestop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-900 text-sm">Job Board</h3>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="https://www.elevateforhumanity.org/jobs"
            target="_blank"
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            View public board <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-extrabold text-slate-900">
            {loading ? '—' : (stats?.total ?? 0)}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Gov feed jobs
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-slate-700 mb-1">Last import</p>
          <p className="text-xs text-slate-500">
            {loading
              ? '—'
              : stats?.lastImport
              ? new Date(stats.lastImport).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </div>
      )}

      {/* API source status */}
      <div className="space-y-1.5 mb-4">
        {sources.map(({ key, label, href, note }) => {
          const configured = stats?.configured?.[key] ?? false;
          return (
            <div key={key} className="flex items-center justify-between text-xs">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:underline flex items-center gap-1"
              >
                {label}
              </a>
              {loading ? (
                <span className="text-slate-300">—</span>
              ) : configured ? (
                <span className="flex items-center gap-1 text-brand-green-600 font-semibold">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              ) : (
                <span title={note} className="flex items-center gap-1 text-amber-600 font-semibold cursor-help">
                  <AlertCircle className="w-3 h-3" /> Needs approval
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Import result */}
      {importResult && (
        <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${importResult.skipped === -1 ? 'bg-red-50 text-red-700' : 'bg-brand-green-50 text-brand-green-700'}`}>
          {importResult.skipped === -1
            ? 'Import failed — check server logs.'
            : `Imported ${importResult.imported} jobs, ${importResult.skipped} skipped.`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={runImport}
          disabled={importing}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
          {importing ? 'Importing…' : 'Run Import'}
        </button>
        <Link
          href="/jobs/new"
          className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5" />
          Post a Job
        </Link>
      </div>
    </div>
  );
}

// Default export for next/dynamic
export default JobBoardPanel;
