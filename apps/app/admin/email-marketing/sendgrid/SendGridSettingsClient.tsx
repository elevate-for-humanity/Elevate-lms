'use client';

import { useState } from 'react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Settings,
  Activity,
} from 'lucide-react';

interface Props {
  config: {
    fromEmail: string;
    replyTo: string;
    apiKeyConfigured: boolean;
    domainVerified: boolean | null;
  };
  stats: {
    sent: number;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    spam: number;
  } | null;
}

export default function SendGridSettingsClient({ config, stats }: Props) {
  const [testTo, setTestTo] = useState('elevate4humanityedu@gmail.com');
  const [testSubject, setTestSubject] = useState(`SendGrid Test — ${PLATFORM_DEFAULTS.orgName}`);
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleTestSend() {
    if (!testTo.trim()) return;
    setSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/sendgrid/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo.trim(), subject: testSubject.trim() }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, message: data.message ?? (res.ok ? 'Email sent successfully.' : data.error ?? 'Send failed.') });
    } catch {
      setTestResult({ ok: false, message: 'Network error — please try again.' });
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyDomain() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch('/api/admin/sendgrid/verify-domain', { method: 'POST' });
      const data = await res.json();
      setVerifyResult({ ok: res.ok, message: data.message ?? (res.ok ? 'Domain verified.' : data.error ?? 'Verification failed.') });
    } catch {
      setVerifyResult({ ok: false, message: 'Network error — please try again.' });
    } finally {
      setVerifying(false);
    }
  }

  async function handleSaveKey() {
    if (!newKey.trim()) return;
    setSavingKey(true);
    setSaveResult(null);
    try {
      const res = await fetch('/api/admin/sendgrid/update-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: newKey.trim() }),
      });
      const data = await res.json();
      setSaveResult({ ok: res.ok, message: data.message ?? (res.ok ? 'API key updated.' : data.error ?? 'Update failed.') });
      if (res.ok) setNewKey('');
    } catch {
      setSaveResult({ ok: false, message: 'Network error — please try again.' });
    } finally {
      setSavingKey(false);
    }
  }

  const deliveryRate = stats && stats.sent > 0
    ? ((stats.delivered / stats.sent) * 100).toFixed(1)
    : null;
  const openRate = stats && stats.delivered > 0
    ? ((stats.opens / stats.delivered) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-8">

      {/* Status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${
        config.apiKeyConfigured && config.domainVerified
          ? 'bg-green-50 border-green-200'
          : config.apiKeyConfigured
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200'
      }`}>
        {config.apiKeyConfigured && config.domainVerified ? (
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
        ) : config.apiKeyConfigured ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-slate-900 text-sm">
            {config.apiKeyConfigured && config.domainVerified
              ? 'SendGrid is fully configured and domain-verified'
              : config.apiKeyConfigured
              ? 'SendGrid API key is set — domain authentication pending'
              : 'SendGrid API key is not configured'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            From: <strong>{config.fromEmail}</strong> · Reply-to: <strong>{config.replyTo}</strong>
          </p>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Last 30 Days
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Sent', value: stats.sent.toLocaleString(), color: 'text-slate-900' },
              { label: 'Delivered', value: stats.delivered.toLocaleString(), sub: deliveryRate ? `${deliveryRate}%` : null, color: 'text-green-700' },
              { label: 'Opens', value: stats.opens.toLocaleString(), sub: openRate ? `${openRate}%` : null, color: 'text-blue-700' },
              { label: 'Clicks', value: stats.clicks.toLocaleString(), color: 'text-purple-700' },
              { label: 'Bounces', value: stats.bounces.toLocaleString(), color: stats.bounces > 0 ? 'text-amber-700' : 'text-slate-400' },
              { label: 'Spam', value: stats.spam.toLocaleString(), color: stats.spam > 0 ? 'text-red-700' : 'text-slate-400' },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                {s.sub && <p className="text-xs text-slate-500">{s.sub}</p>}
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Test send */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-red-600" /> Send Test Email
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">To</label>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
              <input
                type="text"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red-500"
              />
            </div>
          </div>
          {testResult && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${testResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {testResult.message}
            </div>
          )}
          <button
            onClick={handleTestSend}
            disabled={sending || !testTo.trim()}
            className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send Test Email'}
          </button>
        </div>

        {/* Domain verification */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue-600" /> Domain Authentication
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>Domain</span>
              <span className="font-mono font-semibold text-slate-900">${PLATFORM_DEFAULTS.canonicalDomain}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>From address</span>
              <span className="font-mono text-slate-900">{config.fromEmail}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span>Reply-to</span>
              <span className="font-mono text-slate-900">{config.replyTo}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Domain verified</span>
              {config.domainVerified === true ? (
                <span className="flex items-center gap-1 text-green-700 font-semibold"><CheckCircle2 className="w-4 h-4" /> Verified</span>
              ) : config.domainVerified === false ? (
                <span className="flex items-center gap-1 text-red-600 font-semibold"><XCircle className="w-4 h-4" /> Not verified</span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertTriangle className="w-4 h-4" /> Unknown</span>
              )}
            </div>
          </div>
          {verifyResult && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${verifyResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {verifyResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {verifyResult.message}
            </div>
          )}
          <button
            onClick={handleVerifyDomain}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {verifying ? 'Checking…' : 'Check Domain Status'}
          </button>
        </div>

        {/* API key management */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 lg:col-span-2">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" /> API Key
          </h2>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-600 flex-1">
              Current key: <span className="font-mono">{config.apiKeyConfigured ? 'SG.••••••••••••••••••••••••••••••••••••••••••••••••••••••' : 'Not configured'}</span>
            </span>
            {config.apiKeyConfigured && (
              <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">Active</span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            To rotate the key: generate a new one in <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 underline">SendGrid → Settings → API Keys</a>, paste it below, and save.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-red-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSaveKey}
              disabled={savingKey || !newKey.trim()}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold px-5 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              {savingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingKey ? 'Saving…' : 'Save Key'}
            </button>
          </div>
          {saveResult && (
            <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${saveResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {saveResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              {saveResult.message}
            </div>
          )}
        </div>

      </div>

      {/* DNS records reference */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" /> Required DNS Records
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Add these records in your domain registrar to complete SendGrid domain authentication.
          The <code className="bg-slate-200 px-1 rounded text-xs">s1._domainkey</code> CNAME is currently missing.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase text-slate-500">Type</th>
                <th className="text-left py-2 pr-4 text-xs font-bold uppercase text-slate-500">Name</th>
                <th className="text-left py-2 text-xs font-bold uppercase text-slate-500">Content</th>
                <th className="text-left py-2 pl-4 text-xs font-bold uppercase text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { type: 'CNAME', name: 'em3098', content: 'u60320539.wl040.sendgrid.net', status: 'ok' },
                { type: 'CNAME', name: 's1._domainkey', content: 's1.domainkey.u60320539.wl040.sendgrid.net', status: 'missing' },
                { type: 'CNAME', name: 's2._domainkey', content: 's2.domainkey.u60320539.wl040.sendgrid.net', status: 'ok' },
              ].map((r) => (
                <tr key={r.name}>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">{r.type}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">{r.name}</td>
                  <td className="py-2.5 font-mono text-xs text-slate-700 break-all">{r.content}</td>
                  <td className="py-2.5 pl-4">
                    {r.status === 'ok' ? (
                      <span className="flex items-center gap-1 text-green-700 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" /> Added</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Missing</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
