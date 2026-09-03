'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Key } from 'lucide-react';

interface LicenseRequest {
  id: string;
  license_type: string | null;
  status: string;
  requested_at: string | null;
  approved_at: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;
type Filter = typeof FILTERS[number];

export default function LicenseRequestsClient({ initialRequests }: { initialRequests: LicenseRequest[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState<Filter>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id); setError(null);
    try {
      // 1. Update license request status
      const res = await fetch('/api/admin/license-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));

      // 2. On approval, trigger tenant provisioning
      if (status === 'approved') {
        const req = requests.find(r => r.id === id);
        if (req) {
          const provRes = await fetch('/api/onboarding/provision-tenant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              licenseRequestId: id,
              contactEmail: req.profiles?.email ?? '',
              contactName: req.profiles?.full_name ?? '',
              organizationName: req.profiles?.full_name ?? 'New Organization',
              licenseType: req.license_type ?? 'standard',
            }),
          });
          if (!provRes.ok) {
            const d = await provRes.json().catch(() => ({}));
            // Non-fatal — status already updated; surface warning
            setError(`Approved, but tenant provisioning failed: ${d.error ?? 'unknown error'}. Run manually from Tenants page.`);
          }
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <Key className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {filter === 'all' ? '' : filter} requests</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Requester', 'License Type', 'Status', 'Requested', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{r.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{r.profiles?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                    {r.license_type?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {r.status === 'pending' && <Clock className="w-3 h-3" />}
                      {r.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                      {r.status === 'rejected' && <XCircle className="w-3 h-3" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {r.requested_at ? new Date(r.requested_at).toLocaleDateString() : new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateStatus(r.id, 'approved')} disabled={processingId === r.id}
                          className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                          <CheckCircle className="w-3 h-3" /> Approve
                        </button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} disabled={processingId === r.id}
                          className="flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
