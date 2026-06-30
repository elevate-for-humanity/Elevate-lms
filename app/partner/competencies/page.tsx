'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BadgeCheck, Clock, RefreshCcw, Scissors, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { logger } from '@/lib/logger';

type PendingRep = {
  id: string;
  apprenticeId: string;
  apprenticeName: string;
  skillName: string;
  workDate: string;
  serviceCount: number;
  notes: string | null;
  supervisorName: string | null;
  submittedAt: string;
};

const parseWorkDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00Z`);
};

export default function PartnerCompetenciesPage() {
  const [entries, setEntries] = useState<PendingRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/competency/pending-reps');
      if (res.status === 401) {
        setError('Please sign in to review competency reps.');
        return;
      }
      if (res.status === 403) {
        setError('You are not authorized to verify competency reps.');
        return;
      }
      if (!res.ok) throw new Error('Failed to load pending reps');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err: unknown) {
      logger.error(
        'Failed to load pending competency reps',
        { route: '/api/competency/pending-reps' },
        err instanceof Error ? err : undefined,
      );
      setError('Failed to load pending reps. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleVerify = async (entry: PendingRep) => {
    setProcessing(entry.id);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/competency/verify-rep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competencyLogId: entry.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to verify rep');
      setEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setSuccess(
        `Verified ${entry.serviceCount} rep${entry.serviceCount !== 1 ? 's' : ''} successfully.`,
      );
    } catch (err: unknown) {
      logger.error(
        'Failed to verify competency rep',
        { route: '/api/competency/verify-rep', competencyLogId: entry.id },
        err instanceof Error ? err : undefined,
      );
      const message = err instanceof Error ? err.message : 'Failed to verify rep.';
      setError(message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mb-6">
        <Breadcrumbs
          items={[{ label: 'Partner', href: '/partner/dashboard' }, { label: 'Competencies' }]}
        />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Competency Verification</h1>
            <p className="text-slate-600 mt-1">
              Approve barber service reps (cuts, shaves, chemical services, sanitation).
            </p>
          </div>
          <button
            onClick={fetchPending}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          Only verify reps you personally witnessed. Your sign-off is a legal attestation for DOL
          records.
        </div>

        {error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand-red-600" />
            <p className="text-brand-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-brand-green-50 border border-brand-green-200 rounded-lg flex items-center gap-3">
            <BadgeCheck className="w-5 h-5 text-brand-green-600" />
            <p className="text-brand-green-800">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-500">Loading pending reps...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-xl border p-10 text-center">
            <BadgeCheck className="w-12 h-12 text-brand-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">All caught up</h2>
            <p className="text-slate-600 mb-4">No competency reps waiting for your review.</p>
            <Link
              href="/partner/hours"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50"
            >
              Back to Hours
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry) => {
              const workDate = parseWorkDate(entry.workDate);
              const submitted = new Date(entry.submittedAt);
              return (
                <div key={entry.id} className="bg-white rounded-xl border p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-brand-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{entry.apprenticeName}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-slate-400" />
                            {entry.skillName}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
                        <div>
                          <span className="block text-xs text-slate-400 uppercase tracking-wide">
                            Date Performed
                          </span>
                          {workDate
                            ? workDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                timeZone: 'UTC',
                              })
                            : entry.workDate}
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400 uppercase tracking-wide">
                            Reps Logged
                          </span>
                          {entry.serviceCount} rep{entry.serviceCount !== 1 ? 's' : ''}
                        </div>
                        <div>
                          <span className="block text-xs text-slate-400 uppercase tracking-wide">
                            Submitted
                          </span>
                          {submitted.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          {submitted.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm text-slate-600">
                          {entry.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(entry)}
                        disabled={processing === entry.id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        {processing === entry.id ? 'Verifying…' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
