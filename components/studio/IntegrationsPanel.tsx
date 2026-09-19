'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Zap,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Globe,
  Server,
  Activity,
} from 'lucide-react';

type FeedStats = {
  total?: number;
  count?: number;
  lastImport?: string | null;
  configured?: {
    usajobs?: boolean;
    careeronestop?: boolean;
    indiana_career_connect?: boolean;
  };
  status?: string;
  message?: string;
};

type HealthSnapshot = {
  overall: 'healthy' | 'degraded' | 'down' | string;
  alerts: Array<{ service: string; severity: string; message: string }>;
  services: Record<string, { name: string; status: string; configured?: boolean; message?: string }>;
  ai?: { anyConfigured?: boolean };
};

function JobBoardPanel() {
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  async function loadStats() {
    setLoading(true);
    try {
      const r = await fetch('/api/jobs/government-feed', { cache: 'no-store' });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
      setStats(json);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load job feed status');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  async function runImport() {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/jobs/government-feed', { method: 'POST' });
      const data = await res.json();
      setImportResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0 });
      await loadStats();
    } catch {
      setImportResult({ imported: 0, skipped: -1 });
    } finally {
      setImporting(false);
    }
  }

  const configured = stats?.configured ?? {};
  const sources = [
    { key: 'usajobs' as const, label: 'USAJobs.gov' },
    { key: 'careeronestop' as const, label: 'CareerOneStop' },
    { key: 'indiana_career_connect' as const, label: 'Indiana Career Connect' },
  ];

  const total = stats?.total ?? stats?.count ?? 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-slate-600" />
          <h3 className="text-sm font-semibold text-slate-900">Job Board</h3>
        </div>
        <Link href="https://www.elevateforhumanity.org/jobs" target="_blank" className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          View public board <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-4">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{loading ? '—' : total}</p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-500">
              <Zap className="h-3 w-3 text-amber-500" /> Gov feed jobs
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="mb-1 text-xs font-semibold text-slate-700">Last import</p>
            <p className="text-xs text-slate-500">
              {loading ? '—' : stats?.lastImport ? new Date(stats.lastImport).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>

        {(error || stats?.message) && (
          <div className="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-700">
            {error || stats?.message}
          </div>
        )}

        {importResult && (
          <div className={`mb-3 rounded p-2 text-xs ${importResult.skipped === -1 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {importResult.skipped === -1
              ? 'Import unavailable. Check feed configuration.'
              : `Imported ${importResult.imported}, skipped ${importResult.skipped}`}
          </div>
        )}

        <div className="mb-4 space-y-2">
          {sources.map((s) => {
            const ready = Boolean(configured[s.key]);
            return (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {ready ? <CheckCircle className="h-3.5 w-3.5 text-green-600" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                  <span className="text-slate-700">{s.label}</span>
                </div>
                <span className={ready ? 'text-green-600' : 'text-amber-600'}>{ready ? 'Configured' : 'Needs setup'}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={runImport}
          disabled={importing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-blue-700 disabled:opacity-50"
        >
          {importing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {importing ? 'Importing...' : 'Run Import'}
        </button>
      </div>
    </div>
  );
}

export default function IntegrationsPanel() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [healthError, setHealthError] = useState('');

  useEffect(() => {
    fetch('/api/admin/platform-health', { cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error ?? `HTTP ${r.status}`);
        return json as HealthSnapshot;
      })
      .then((json) => {
        setHealth(json);
        setHealthError('');
      })
      .catch((err) => setHealthError(err instanceof Error ? err.message : 'Health status unavailable'));
  }, []);

  const stripe = health?.services
    ? Object.values(health.services).find((service) => service.name === 'Stripe')
    : undefined;
  const stripeConfigured = Boolean(stripe?.configured && stripe?.status === 'healthy');
  const alertCount = health?.alerts?.length ?? 0;
  const firstAlert = health?.alerts?.[0];

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
        <p className="text-sm text-slate-500">Manage external integrations and feeds</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <JobBoardPanel />

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Stripe</h3>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${stripeConfigured ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {health ? (stripeConfigured ? 'Configured' : 'Needs setup') : 'Checking…'}
            </span>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600">
              {stripe?.message || (stripeConfigured ? 'Stripe runtime configuration is available.' : 'Stripe runtime configuration is incomplete.')}
            </p>
            <Link href="/integrations/stripe" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200">
              Configure Stripe <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">System Health</h3>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${alertCount === 0 && health ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {health ? `${alertCount} active ${alertCount === 1 ? 'alert' : 'alerts'}` : 'Checking…'}
            </span>
          </div>
          <div className="p-4">
            {healthError ? (
              <p className="mb-3 text-xs text-red-600">{healthError}</p>
            ) : firstAlert ? (
              <div className="mb-3 flex items-start gap-2 text-xs text-slate-600">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                <span>{firstAlert.service}: {firstAlert.message}</span>
              </div>
            ) : (
              <p className="mb-3 text-xs text-slate-600">{health ? 'No active platform alerts.' : 'Loading platform health…'}</p>
            )}
            <Link href="/system-health" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200">
              View Details <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-900">Northflank Services</h3>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-600">
              Deployment health is maintained by Northflank. Open Operations for current service/build status instead of displaying cached or hard-coded values here.
            </p>
            <Link href="/operations" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200">
              View Operations <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
