'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Zap, RefreshCw, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

type FeedStats = {
  count: number;
  sources: Record<string, { records: number; latestImport: string | null }>;
  configured: {
    usajobs: boolean;
    careerOneStop: boolean;
  };
};

export function JobBoardPanel() {
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<number | null>(null);
  const [importError, setImportError] = useState('');
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  async function loadStats() {
    const response = await fetch('/api/jobs/government-feed', { cache: 'no-store' });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error ?? `Job feed status failed (HTTP ${response.status})`);
    if (!Number.isInteger(json.count) || !json.configured || !json.sources) {
      throw new Error('Job feed returned an invalid status response.');
    }
    setStats(json);
    setError('');
  }

  useEffect(() => {
    void loadStats()
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load job feed status'))
      .finally(() => setLoading(false));
  }, []);

  async function runImport() {
    if (importing) return;
    setImporting(true);
    setImportResult(null);
    setImportError('');
    setSourceErrors([]);
    try {
      const res = await fetch('/api/jobs/government-feed', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Job import failed (HTTP ${res.status})`);
      if (data.ok !== true || !Number.isInteger(data.imported?.total) || data.imported.total < 0) {
        throw new Error('The server did not confirm the import result. Check job feed status before retrying.');
      }
      setImportResult(data.imported.total);
      setSourceErrors([
        ['usaJobs', 'USAJobs'], ['careerOneStop', 'CareerOneStop'], ['onet', 'O*NET'],
      ].flatMap(([key, label]) => typeof data.errors?.[key] === 'string' && data.errors[key] ? [`${label}: ${data.errors[key]}`] : []));
      try {
        await loadStats();
      } catch (reason) {
        setError(`Import completed, but status could not refresh: ${reason instanceof Error ? reason.message : 'Unknown status error'}`);
      }
    } catch (reason) {
      setImportError(reason instanceof Error ? reason.message : 'Job import could not complete.');
    } finally {
      setImporting(false);
    }
  }

  const sources = [
    { key: 'usajobs' as const, label: 'USAJobs.gov', href: 'https://developer.usajobs.gov', note: 'Federal jobs API' },
    { key: 'careerOneStop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/', note: 'DOL-funded job listings' },
  ];
  const lastImport = Object.values(stats?.sources ?? {})
    .map(source => source.latestImport)
    .filter((date): date is string => typeof date === 'string' && Number.isFinite(Date.parse(date)))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

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
            {stats?.count ?? '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Recent feed jobs
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-xs font-semibold text-slate-700 mb-1">Last import</p>
          <p className="text-xs text-slate-500">
            {loading || !stats
              ? '—'
              : lastImport
              ? new Date(lastImport).toLocaleDateString('en-US', {
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
        <div role="alert" className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
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
                  <CheckCircle className="w-3 h-3" /> API configured
                </span>
              ) : (
                <span title={note} className="flex items-center gap-1 text-amber-600 font-semibold cursor-help">
                  <AlertCircle className="w-3 h-3" /> {stats ? 'API not configured' : 'Status unavailable'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Import result */}
      {importResult !== null && (
        <div role="status" className="text-xs rounded-lg px-3 py-2 mb-3 bg-brand-green-50 text-brand-green-700">
          Imported {importResult} jobs.
        </div>
      )}
      {(importError || sourceErrors.length > 0) && (
        <div role="alert" className="text-xs rounded-lg px-3 py-2 mb-3 bg-red-50 text-red-700">
          {importError || `Some sources could not complete: ${sourceErrors.join('; ')}`}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="button"
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
