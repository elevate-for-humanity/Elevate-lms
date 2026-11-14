'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, User, Calendar, AlertCircle } from 'lucide-react';

interface HourEntry {
  id: string;
  user_id: string;
  work_date: string;
  hours_claimed: number;
  source_type: string;
  category: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  profile?: { first_name?: string; last_name?: string; full_name?: string; email?: string } | null;
}

export function HoursApprovalQueue() {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      // Use the API route which has admin client + role checks
      const res = await fetch('/api/employer/hours');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const hours = data.hours || [];

      setEntries(
        hours.map((h: any) => ({
          ...h,
          user_name: h.profile
            ? `${h.profile.first_name || ''} ${h.profile.last_name || ''}`.trim() ||
              h.profile.full_name ||
              'Unknown'
            : 'Unknown',
          user_email: h.profile?.email || '',
        })),
      );
    } catch {
      setMessage({ type: 'error', text: 'Failed to load pending hours' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Clock className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-pulse" />
        <p className="text-slate-700">Loading pending hours...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-brand-green-50 border border-brand-green-200 text-brand-green-800'
              : 'bg-brand-red-50 border border-brand-red-200 text-brand-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-slate-800">
          These are pending ledger records. Final apprenticeship approval requires an authorized
          sponsor administrator to review the canonical submission and supporting evidence.
        </p>
        <a
          href="https://admin.elevateforhumanity.org/apprenticeships"
          className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Open canonical apprenticeship review
        </a>
        <p className="mt-2 text-xs text-slate-700">
          The Admin portal verifies your approval permissions. Ledger-only records and disputes
          need reconciliation before they can receive credit.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Pending ledger records</h2>
          <p className="text-slate-700">No pending ledger records were returned. Check canonical apprenticeship review for submitted hours.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-xl border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{entry.user_name}</h3>
                      <p className="text-sm text-slate-700">{entry.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-700" />
                      <span className="text-sm text-slate-900">
                        {new Date(entry.work_date).toLocaleDateString('en-US', {
                          timeZone: 'UTC',
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-700" />
                      <span className="text-sm font-medium text-slate-900">
                        {entry.hours_claimed} hours
                      </span>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.source_type === 'ojt'
                            ? 'bg-brand-blue-100 text-brand-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {entry.source_type === 'ojt'
                          ? 'OJT'
                          : entry.source_type === 'rti'
                            ? 'RTI'
                            : entry.source_type?.toUpperCase()}
                      </span>
                    </div>
                    {entry.category && (
                      <span className="text-sm text-slate-700">{entry.category}</span>
                    )}
                  </div>

                  {entry.notes && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm text-slate-900">{entry.notes}</p>
                    </div>
                  )}
                </div>


              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
