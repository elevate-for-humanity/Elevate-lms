'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, User,
  Loader2, AlertCircle, Building2, Users, FileText,
  ChevronDown, ChevronUp, Calendar, MessageSquare,
} from 'lucide-react';

interface PendingEntry {
  id: string;
  apprenticeId: string;
  apprenticeName: string;
  weekEnding: string;
  hours: number;
  notes?: string;
  submittedAt: string;
}

function RejectModal({
  entry,
  onConfirm,
  onCancel,
}: {
  entry: PendingEntry;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Reject Hours</h3>
          <p className="text-sm text-slate-500 mt-1">
            {entry.apprenticeName} — {entry.hours}h · week ending{' '}
            {new Date(entry.weekEnding).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div className="p-5">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Reason (optional — sent to apprentice)
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Hours exceed scheduled shift, please resubmit with correct total."
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            autoFocus
          />
        </div>
        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function EntryCard({
  entry,
  processing,
  onApprove,
  onReject,
}: {
  entry: PendingEntry;
  processing: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const submitted  = new Date(entry.submittedAt);
  const weekEnd    = new Date(entry.weekEnding);
  const hoursColor = entry.hours > 10 ? 'text-amber-600' : 'text-slate-900';

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-opacity ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{entry.apprenticeName}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>
                Week ending {weekEnd.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-2xl font-black ${hoursColor}`}>{entry.hours}</p>
            <p className="text-xs text-slate-400">hours</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Submitted {submitted.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })} at{' '}
            {submitted.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' })}
          </p>
          {entry.notes && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Note
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {expanded && entry.notes && (
          <div className="mt-2 bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 border border-slate-100">
            {entry.notes}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 border-t border-slate-100">
        <button
          onClick={onReject}
          disabled={processing}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-r border-slate-100"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Reject
        </button>
        <button
          onClick={onApprove}
          disabled={processing}
          className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Approve
        </button>
      </div>
    </div>
  );
}

export default function ApproveHoursPage() {
  const [entries, setEntries]           = useState<PendingEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [authError, setAuthError]       = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [processing, setProcessing]     = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingEntry | null>(null);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/pwa/shop-owner/pending-hours');
      if (res.status === 401) { setAuthError(true); return; }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setFetchError('Could not load pending hours. Tap the refresh button to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleApprove = async (entry: PendingEntry) => {
    setProcessing(entry.id);
    try {
      const res = await fetch('/api/pwa/shop-owner/approve-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, action: 'approve' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? 'Failed to approve', 'error');
        return;
      }
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      showToast(`Approved ${entry.hours}h for ${entry.apprenticeName}`, 'success');
    } catch {
      showToast('Network error — please try again', 'error');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectTarget) return;
    const entry = rejectTarget;
    setRejectTarget(null);
    setProcessing(entry.id);
    try {
      const res = await fetch('/api/pwa/shop-owner/approve-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: entry.id, action: 'reject', reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? 'Failed to reject', 'error');
        return;
      }
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      showToast(`Rejected hours for ${entry.apprenticeName}`, 'success');
    } catch {
      showToast('Network error — please try again', 'error');
    } finally {
      setProcessing(null);
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="font-bold text-slate-900 mb-2">Sign in required</h2>
          <p className="text-sm text-slate-500 mb-5">You need to be signed in to approve hours.</p>
          <Link
            href="/login?redirect=/pwa/shop-owner/approve-hours"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-semibold px-5 py-3 rounded-xl text-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {rejectTarget && (
        <RejectModal
          entry={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      <div className="min-h-screen bg-slate-50 pb-24">
        <header className="bg-white border-b border-slate-200 px-4 pt-12 pb-4 safe-area-inset-top">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <Link href="/pwa/shop-owner"
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-black text-slate-900">Approve Hours</h1>
              {!loading && !fetchError && (
                <p className="text-xs text-slate-500">
                  {entries.length === 0
                    ? 'No pending submissions'
                    : `${entries.length} submission${entries.length !== 1 ? 's' : ''} awaiting review`}
                </p>
              )}
            </div>
            <button onClick={fetchPending} disabled={loading}
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
              aria-label="Refresh">
              {loading
                ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                : <Clock className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </header>

        <main className="px-4 py-5 max-w-lg mx-auto space-y-3">
          {loading && [1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-32" />
                  <div className="h-3 bg-slate-100 rounded w-24" />
                </div>
                <div className="w-10 h-8 bg-slate-100 rounded" />
              </div>
            </div>
          ))}

          {!loading && fetchError && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">{fetchError}</p>
              <button onClick={fetchPending}
                className="text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                Try again
              </button>
            </div>
          )}

          {!loading && !fetchError && entries.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="font-bold text-slate-900 mb-1">All caught up</h2>
              <p className="text-sm text-slate-500">No pending hours to review right now.</p>
            </div>
          )}

          {!loading && !fetchError && entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              processing={processing === entry.id}
              onApprove={() => handleApprove(entry)}
              onReject={() => setRejectTarget(entry)}
            />
          ))}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 safe-area-inset-bottom">
          <div className="flex justify-around max-w-lg mx-auto">
            {[
              { href: '/pwa/shop-owner',             icon: <Building2 className="w-5 h-5" />, label: 'Home' },
              { href: '/pwa/shop-owner/log-hours',   icon: <Clock className="w-5 h-5" />,     label: 'Log' },
              { href: '/pwa/shop-owner/apprentices', icon: <Users className="w-5 h-5" />,     label: 'Team' },
              { href: '/pwa/shop-owner/reports',     icon: <FileText className="w-5 h-5" />,  label: 'Reports' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors">
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
