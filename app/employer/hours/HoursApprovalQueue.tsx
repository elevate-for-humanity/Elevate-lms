'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, User, Calendar, AlertCircle } from 'lucide-react';

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
  user_profiles?: { first_name?: string; last_name?: string; email?: string } | null;
}

export function HoursApprovalQueue() {
  const [entries, setEntries] = useState<HourEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
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

      setEntries(hours.map((h: any) => ({
        ...h,
        user_name: h.user_profiles
          ? `${h.user_profiles.first_name || ''} ${h.user_profiles.last_name || ''}`.trim() || 'Unknown'
          : 'Unknown',
        user_email: h.user_profiles?.email || '',
      })));
    } catch {
      setMessage({ type: 'error', text: 'Failed to load pending hours' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (entryId: string, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
    }

    setProcessing(entryId);
    setMessage(null);

    try {
      const endpoint = action === 'approve'
        ? '/api/employer/hours/approve'
        : '/api/apprenticeship/hours/reject';

      const body = action === 'approve'
        ? { hour_id: entryId }
        : { hour_id: entryId, reason: 'Rejected by employer' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }

      setEntries(prev => prev.filter(e => e.id !== entryId));
      setMessage({ type: 'success', text: `Hours ${action}d` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (entries.length === 0) return;
    if (!confirm(`Approve all ${entries.length} pending entries?`)) return;

    setProcessing('bulk');
    setMessage(null);

    try {
      const res = await fetch('/api/apprenticeship/hours/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hour_ids: entries.map(e => e.id) }),
      });

      if (!res.ok) throw new Error('Bulk approve failed');

      setEntries([]);
      setMessage({ type: 'success', text: `${entries.length} entries approved` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Bulk approve failed' });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-12 text-center">
        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-500">Loading pending hours...</p>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-brand-green-50 border border-brand-green-200 text-brand-green-800'
            : 'bg-brand-red-50 border border-brand-red-200 text-brand-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p>{message.text}</p>
        </div>
      )}

      {entries.length > 1 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={handleBulkApprove}
            disabled={processing === 'bulk'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {processing === 'bulk' ? 'Processing...' : `Approve All (${entries.length})`}
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up</h2>
          <p className="text-gray-600">No pending hours to review.</p>
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
                      <h3 className="font-semibold text-gray-900">{entry.user_name}</h3>
                      <p className="text-sm text-gray-500">{entry.user_email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">
                        {new Date(entry.work_date).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{entry.hours_claimed} hours</span>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        entry.source_type === 'ojt'
                          ? 'bg-brand-blue-100 text-brand-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {entry.source_type === 'ojt' ? 'OJT' : entry.source_type === 'rti' ? 'RTI' : entry.source_type?.toUpperCase()}
                      </span>
                    </div>
                    {entry.category && (
                      <span className="text-sm text-gray-500">{entry.category}</span>
                    )}
                  </div>

                  {entry.notes && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">{entry.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleAction(entry.id, 'reject')}
                    disabled={processing === entry.id}
                    className="inline-flex items-center gap-1 px-3 py-2 text-brand-red-600 hover:bg-brand-red-50 rounded-lg disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(entry.id, 'approve')}
                    disabled={processing === entry.id}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {processing === entry.id ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
