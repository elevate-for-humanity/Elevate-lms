'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  ArrowLeft, CheckCircle2, XCircle, RefreshCw,
  DollarSign, Users, ExternalLink, AlertTriangle, Loader2,
} from 'lucide-react';

interface QBStatus {
  connected: boolean;
  realm_id?: string | null;
  company_name?: string;
  last_sync?: string | null;
  message?: string;
  error?: string;
  auth_url?: string;
}

export default function QuickBooksClient() {
  const [status, setStatus]   = useState<QBStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [result, setResult]   = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => { checkStatus(); }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/integrations/quickbooks?action=status');
      if (res.ok) setStatus(await res.json());
    } catch { /* show disconnected */ }
    finally { setLoading(false); }
  }

  async function getAuthUrl() {
    try {
      const res = await fetch('/api/admin/integrations/quickbooks?action=auth_url');
      if (res.ok) {
        const d = await res.json();
        setAuthUrl(d.auth_url);
      }
    } catch { /* ignore */ }
  }

  async function sync(action: 'sync_payroll' | 'sync_expenses') {
    setSyncing(action);
    setResult(null);
    try {
      const res = await fetch('/api/admin/integrations/quickbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      setResult(d.message ?? (res.ok ? 'Done' : d.error ?? 'Failed'));
      if (res.ok) checkStatus();
    } catch { setResult('Network error'); }
    finally { setSyncing(null); }
  }

  async function disconnect() {
    if (!confirm('Disconnect QuickBooks? You will need to reconnect to sync again.')) return;
    setSyncing('disconnect');
    try {
      const res = await fetch('/api/admin/integrations/quickbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      const d = await res.json();
      setResult(d.message ?? 'Disconnected');
      checkStatus();
    } catch { setResult('Network error'); }
    finally { setSyncing(null); }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Admin', href: '/admin' },
        { label: 'Integrations', href: '/admin/integrations' },
        { label: 'QuickBooks' },
      ]} />

      <div className="flex items-center gap-3 mt-6 mb-8">
        <Link href="/admin/integrations" className="text-slate-400 hover:text-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">QuickBooks Online</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sync payroll and expenses with QuickBooks</p>
        </div>
      </div>

      {/* Status card */}
      <div className={`rounded-2xl border p-6 mb-6 ${status.connected ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            ) : status.connected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-slate-400" />
            )}
            <div>
              <p className="font-semibold text-slate-800">
                {status.connected ? 'Connected' : 'Not connected'}
              </p>
              {status.company_name && (
                <p className="text-sm text-slate-500">{status.company_name}</p>
              )}
              {status.realm_id && (
                <p className="text-xs text-slate-400 font-mono">Realm: {status.realm_id}</p>
              )}
            </div>
          </div>
          <button onClick={checkStatus} disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {status.error && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {status.error}
          </div>
        )}

        {!status.connected && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Connect your QuickBooks Online account to sync payroll runs and expenses.
            </p>
            {!authUrl ? (
              <button onClick={getAuthUrl}
                className="w-full bg-[#2CA01C] hover:bg-[#248016] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Connect QuickBooks
              </button>
            ) : (
              <a href={authUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#2CA01C] hover:bg-[#248016] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                Authorize with Intuit <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <p className="text-xs text-slate-400">
              Requires QB_CLIENT_ID and QB_CLIENT_SECRET in your environment.
            </p>
          </div>
        )}
      </div>

      {/* Sync actions */}
      {status.connected && (
        <div className="space-y-3 mb-6">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Sync</h2>

          <button onClick={() => sync('sync_payroll')} disabled={!!syncing}
            className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors text-left">
            <Users className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-slate-800 text-sm">Sync Payroll</p>
              <p className="text-xs text-slate-500">Pull employee records from QuickBooks</p>
            </div>
            {syncing === 'sync_payroll' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </button>

          <button onClick={() => sync('sync_expenses')} disabled={!!syncing}
            className="w-full flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors text-left">
            <DollarSign className="w-5 h-5 text-green-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-slate-800 text-sm">Sync Expenses</p>
              <p className="text-xs text-slate-500">Pull purchases/expenses from last 30 days</p>
            </div>
            {syncing === 'sync_expenses' && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </button>
        </div>
      )}

      {result && (
        <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
          {result}
        </div>
      )}

      {/* Disconnect */}
      {status.connected && (
        <button onClick={disconnect} disabled={!!syncing}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 transition-colors">
          Disconnect QuickBooks
        </button>
      )}

      {/* Setup instructions */}
      <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Required environment variables</p>
        <p><code className="font-mono">QB_CLIENT_ID</code> — Intuit app client ID</p>
        <p><code className="font-mono">QB_CLIENT_SECRET</code> — Intuit app client secret</p>
        <p><code className="font-mono">QB_REDIRECT_URI</code> — OAuth callback URL</p>
        <p><code className="font-mono">QB_ACCESS_TOKEN</code> — set after OAuth (auto)</p>
        <p><code className="font-mono">QB_REFRESH_TOKEN</code> — set after OAuth (auto)</p>
        <p><code className="font-mono">QB_REALM_ID</code> — company ID (set after OAuth)</p>
      </div>
    </div>
  );
}
