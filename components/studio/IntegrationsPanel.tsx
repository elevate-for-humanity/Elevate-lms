'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Zap, RefreshCw, ExternalLink, CheckCircle, AlertCircle, Globe, Server, Activity } from 'lucide-react';

type FeedStats = {
  total: number;
  lastImport: string | null;
  configured: {
    usajobs: boolean;
    careeronestop: boolean;
    indiana_career_connect: boolean;
  };
};

function JobBoardPanel() {
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
      const updated = await fetch('/api/jobs/government-feed').then((r) => r.json());
      setStats(updated);
    } catch {
      setImportResult({ imported: 0, skipped: -1 });
    } finally {
      setImporting(false);
    }
  }

  const sources = [
    { key: 'usajobs' as const, label: 'USAJobs.gov', href: 'https://developer.usajobs.gov', note: 'Register at developer.usajobs.gov' },
    { key: 'careeronestop' as const, label: 'CareerOneStop', href: 'https://www.careeronestop.org/Developers/WebAPI/technical-information.aspx', note: 'Request jobsearch access' },
    { key: 'indiana_career_connect' as const, label: 'Indiana Career Connect', href: 'https://www.indianacareerconnect.com', note: '' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-sm text-slate-900">Job Board</h3>
        </div>
        <Link href="https://www.elevateforhumanity.org/jobs" target="_blank" className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
          View public board <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : (stats?.total ?? 0)}</p>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" /> Gov feed jobs
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-slate-700 mb-1">Last import</p>
            <p className="text-xs text-slate-500">
              {loading ? '—' : stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 rounded p-2">{error}</div>
        )}

        {importResult && (
          <div className="mb-3 text-xs text-green-700 bg-green-50 rounded p-2">
            Imported {importResult.imported}, skipped {importResult.skipped}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {sources.map((s) => (
            <div key={s.key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {stats?.configured[s.key] ? (
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="text-slate-700">{s.label}</span>
              </div>
              <span className={stats?.configured[s.key] ? 'text-green-600' : 'text-amber-600'}>
                {stats?.configured[s.key] ? 'Configured' : 'Needs setup'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={runImport}
          disabled={importing}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-3 py-2 text-xs font-medium disabled:opacity-50"
        >
          {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          {importing ? 'Importing...' : 'Run Import'}
        </button>
      </div>
    </div>
  );
}

export default function IntegrationsPanel() {
  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500">Manage external integrations and feeds</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JobBoardPanel />
        
        {/* Stripe Status */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm text-slate-900">Stripe</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Needs approval</span>
          </div>
          <div className="p-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Stripe Webhook</span>
                <span className="text-amber-600">Not approved</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Stripe Issuing</span>
                <span className="text-amber-600">Not approved</span>
              </div>
            </div>
            <Link
              href="/admin/integrations/stripe"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-medium"
            >
              Configure Stripe
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* System Health Quick View */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm text-slate-900">System Health</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">1 issue</span>
          </div>
          <div className="p-4">
            <div className="space-y-2 text-xs text-slate-600 mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Stripe Issuing Not Enabled
              </div>
            </div>
            <Link
              href="/admin/system-health"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-medium"
            >
              View Details
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Northflank Services */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-600" />
              <h3 className="font-semibold text-sm text-slate-900">Northflank Services</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">LMS Service</span>
                <span className="text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Admin Service</span>
                <span className="text-green-600">Healthy</span>
              </div>
            </div>
            <Link
              href="/admin/operations"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-medium"
            >
              View Operations
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
