'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, User, Loader2, AlertCircle,
  Building2, Users, Clock, FileText, Scissors, Calendar,
} from 'lucide-react';

interface PendingRep {
  id: string;
  apprenticeId: string;
  apprenticeName: string;
  skillName: string;
  workDate: string;
  serviceCount: number;
  notes: string | null;
  supervisorName: string | null;
  submittedAt: string;
}

function RepCard({
  entry,
  processing,
  onVerify,
}: {
  entry: PendingRep;
  processing: boolean;
  onVerify: () => void;
}) {
  const workDate   = new Date(entry.workDate + 'T12:00:00');
  const submitted  = new Date(entry.submittedAt);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden transition-opacity ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{entry.apprenticeName}</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <Scissors className="w-3 h-3" />
              <span className="truncate">{entry.skillName}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-black text-slate-900">{entry.serviceCount}</p>
            <p className="text-xs text-slate-400">rep{entry.serviceCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>
              Performed {workDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span>
              Logged {submitted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
              {submitted.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
          {entry.notes && (
            <p className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 mt-2 border border-slate-100">
              {entry.notes}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100">
        <button
          onClick={onVerify}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
        >
          {processing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <CheckCircle2 className="w-4 h-4" />}
          {processing ? 'Verifying…' : 'Verify — I witnessed this'}
        </button>
      </div>
    </div>
  );
}

const NAV = [
  { href: '/pwa/shop-owner',             icon: <Building2 className="w-5 h-5" />, label: 'Home' },
  { href: '/pwa/shop-owner/log-hours',   icon: <Clock className="w-5 h-5" />,     label: 'Log' },
  { href: '/pwa/shop-owner/apprentices', icon: <Users className="w-5 h-5" />,     label: 'Team' },
  { href: '/pwa/shop-owner/reports',     icon: <FileText className="w-5 h-5" />,  label: 'Reports' },
];

export default function VerifyRepsPage() {
  const [entries, setEntries]       = useState<PendingRep[]>([]);
  const [loading, setLoading]       = useState(true);
  const [authError, setAuthError]   = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/pwa/shop-owner/pending-reps');
      if (res.status === 401) { setAuthError(true); return; }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch {
      setFetchError('Could not load pending reps. Tap refresh to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handleVerify = async (entry: PendingRep) => {
    setProcessing(entry.id);
    try {
      const res = await fetch('/api/supervisor/verify-rep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencyLogId: entry.id }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error ?? 'Failed to verify', 'error');
        return;
      }
      setEntries(prev => prev.filter(e => e.id !== entry.id));
      showToast(
        `Verified ${entry.serviceCount} rep${entry.serviceCount !== 1 ? 's' : ''} for ${entry.apprenticeName}`,
        'success',
      );
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
          <p className="text-sm text-slate-500 mb-5">You need to be signed in to verify reps.</p>
          <Link
            href="/login?redirect=/pwa/shop-owner/verify-reps"
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
            <Link
              href="/pwa/shop-owner"
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-black text-slate-900">Verify Skill Reps</h1>
              {!loading && !fetchError && (
                <p className="text-xs text-slate-500">
                  {entries.length === 0
                    ? 'No pending reps to verify'
                    : `${entries.length} rep${entries.length !== 1 ? 's' : ''} awaiting your sign-off`}
                </p>
              )}
            </div>
            <button
              onClick={fetchPending}
              disabled={loading}
              className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center"
              aria-label="Refresh"
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                : <Clock className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </header>

        <main className="px-4 py-5 max-w-lg mx-auto space-y-3">
          {/* Context banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-800">
            Only verify reps you personally witnessed. Your sign-off is a legal attestation
            for Indiana DOL apprenticeship records.
          </div>

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
              <button
                onClick={fetchPending}
                className="text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
              >
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
              <p className="text-sm text-slate-500">No skill reps waiting for your sign-off.</p>
            </div>
          )}

          {!loading && !fetchError && entries.map(entry => (
            <RepCard
              key={entry.id}
              entry={entry}
              processing={processing === entry.id}
              onVerify={() => handleVerify(entry)}
            />
          ))}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 safe-area-inset-bottom">
          <div className="flex justify-around max-w-lg mx-auto">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
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
