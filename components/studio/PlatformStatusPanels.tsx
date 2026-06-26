'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Database,
  CreditCard,
  Github,
  ExternalLink,
  Clock,
  Loader2,
} from 'lucide-react';

interface SupabaseStatus {
  status: 'connected' | 'error' | 'timeout';
  latency_ms: number;
  region: string;
  tables_accessible: number;
  total_tables: number;
  last_error?: string;
}

interface StripeStatus {
  status: 'active' | 'inactive' | 'error';
  mode: 'live' | 'test';
  balance_cents: number;
  active_subscriptions: number;
  failed_payments_24h: number;
  pending_invoices: number;
}

interface GitHubPRStatus {
  total_open: number;
  needs_review: number;
  changes_requested: number;
  approved: number;
  drafts: number;
  recent_prs: Array<{
    number: number;
    title: string;
    state: string;
    url: string;
    updated_at: string;
    author: string;
  }>;
}

interface PlatformStatusData {
  supabase: SupabaseStatus;
  stripe: StripeStatus;
  github: GitHubPRStatus;
  fetched_at: string;
}

function StatusCard({
  title,
  icon: Icon,
  children,
  status,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  status: 'good' | 'warning' | 'error';
}) {
  const colors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-amber-200 bg-amber-50',
    error: 'border-red-200 bg-red-50',
  };
  const iconColors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[status]}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${iconColors[status]}`} />
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function PlatformStatusPanels() {
  const [data, setData] = useState<PlatformStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/devstudio/platform-status');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load status');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load platform status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Platform Status</h2>
        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Supabase Status */}
        <StatusCard
          title="Supabase"
          icon={Database}
          status={
            data?.supabase.status === 'connected' ? 'good' :
            data?.supabase.status === 'timeout' ? 'warning' : 'error'
          }
        >
          {data?.supabase ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`font-medium ${
                  data.supabase.status === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.supabase.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Latency</span>
                <span className="font-mono">{data.supabase.latency_ms}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Region</span>
                <span>{data.supabase.region || 'us-east-1'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tables</span>
                <span>{data.supabase.tables_accessible}/{data.supabase.total_tables}</span>
              </div>
              {data.supabase.last_error && (
                <div className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded">
                  {data.supabase.last_error}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Loading...</div>
          )}
        </StatusCard>

        {/* Stripe Status */}
        <StatusCard
          title="Stripe"
          icon={CreditCard}
          status={
            data?.stripe.status === 'active' ? 'good' :
            data?.stripe.failed_payments_24h > 5 ? 'error' : 'warning'
          }
        >
          {data?.stripe ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`font-medium ${
                  data.stripe.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.stripe.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Mode</span>
                <span className={data.stripe.mode === 'test' ? 'text-amber-600' : 'text-green-600'}>
                  {data.stripe.mode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Balance</span>
                <span className="font-mono">${(data.stripe.balance_cents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Active Subs</span>
                <span>{data.stripe.active_subscriptions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Failed 24h</span>
                <span className={data.stripe.failed_payments_24h > 0 ? 'text-red-600 font-medium' : ''}>
                  {data.stripe.failed_payments_24h}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Pending</span>
                <span>{data.stripe.pending_invoices}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Loading...</div>
          )}
        </StatusCard>

        {/* GitHub PR Status */}
        <StatusCard
          title="GitHub PRs"
          icon={Github}
          status={
            data?.github.total_open === 0 ? 'good' :
            data?.github.changes_requested > 0 ? 'warning' : 'good'
          }
        >
          {data?.github ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Open PRs</span>
                <span className="font-medium">{data.github.total_open}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Needs Review</span>
                <span className="text-blue-600">{data.github.needs_review}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Changes Requested</span>
                <span className={data.github.changes_requested > 0 ? 'text-red-600 font-medium' : ''}>
                  {data.github.changes_requested}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Approved</span>
                <span className="text-green-600">{data.github.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Drafts</span>
                <span className="text-slate-500">{data.github.drafts}</span>
              </div>
              {data.github.recent_prs.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Recent PRs</p>
                  {data.github.recent_prs.slice(0, 3).map((pr) => (
                    <div key={pr.number} className="flex items-center justify-between text-xs mb-1">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate max-w-[150px]"
                      >
                        #{pr.number} {pr.title.slice(0, 30)}...
                      </a>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        pr.state === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pr.state}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Loading...</div>
          )}
        </StatusCard>
      </div>

      {data && (
        <p className="text-xs text-slate-400 text-center">
          Last updated: {new Date(data.fetched_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
