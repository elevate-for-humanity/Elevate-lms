'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export interface ApplicationRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  zip: string | null;
  program_interest: string | null;
  support_notes: string | null;
  status: string;
  source: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  submitted:  'Submitted',
  approved:   'Approved',
  rejected:   'Rejected',
  in_review:  'In Review',
  enrolled:   'Enrolled',
  waitlisted: 'Waitlisted',
};

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-800',
  submitted:  'bg-blue-100 text-blue-800',
  approved:   'bg-emerald-100 text-emerald-800',
  rejected:   'bg-red-100 text-red-800',
  in_review:  'bg-indigo-100 text-indigo-800',
  enrolled:   'bg-teal-100 text-teal-800',
  waitlisted: 'bg-purple-100 text-purple-800',
};

function ActionButton({
  appId,
  action,
  currentStatus,
  onDone,
  onError,
}: {
  appId: string;
  action: 'approved' | 'rejected' | 'in_review';
  currentStatus: string;
  onDone: (id: string, newStatus: string) => void;
  onError: (id: string, msg: string) => void;
}) {
  const [busy, startTransition] = useTransition();

  const labels = { approved: 'Approve', rejected: 'Reject', in_review: 'Review' };
  const styles = {
    approved:  'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    rejected:  'bg-red-100 text-red-700 hover:bg-red-200',
    in_review: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  };
  const icons = {
    approved:  <CheckCircle className="w-2.5 h-2.5" />,
    rejected:  <XCircle className="w-2.5 h-2.5" />,
    in_review: <Eye className="w-2.5 h-2.5" />,
  };

  if (currentStatus === action) return null;

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/applications/${appId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action }),
        });
        if (res.ok) {
          onDone(appId, action);
        } else {
          const body = await res.json().catch(() => null);
          onError(appId, body?.error ?? `Failed to ${labels[action].toLowerCase()} (${res.status})`);
        }
      } catch {
        onError(appId, 'Network error — please try again');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded transition-colors disabled:opacity-50 ${styles[action]}`}
    >
      {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : icons[action]}
      {labels[action]}
    </button>
  );
}

export default function ApplicationsTableClient({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  function handleStatusChange(id: string, newStatus: string) {
    setOverrides(prev => ({ ...prev, [id]: newStatus }));
    setRowError(prev => { const n = { ...prev }; delete n[id]; return n; });
    router.refresh();
  }

  function handleStatusError(id: string, msg: string) {
    setRowError(prev => ({ ...prev, [id]: msg }));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {applications.map(app => {
            const displayName =
              [app.first_name, app.last_name].filter(Boolean).join(' ') ||
              app.full_name ||
              'Unknown';
            const status = overrides[app.id] ?? app.status;
            const isPending = ['pending', 'submitted', 'in_review'].includes(status);

            return (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-sm text-gray-900">{displayName}</div>
                  {app.city && (
                    <div className="text-xs text-gray-500">{app.city}{app.zip ? `, ${app.zip}` : ''}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{app.email || 'N/A'}</div>
                  {app.phone && <div className="text-xs text-gray-500">{app.phone}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {app.program_interest || <span className="text-gray-400">Not specified</span>}
                  {app.source && (
                    <div className="text-xs text-gray-400">{app.source.replace(/-/g, ' ')}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
                    {STATUS_LABELS[status] || status}
                  </span>
                  {rowError[app.id] && (
                    <div className="text-[10px] text-red-600 mt-0.5">{rowError[app.id]}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {new Date(app.created_at).toLocaleDateString('en-US')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    <Link
                      href={`/admin/applications/review/${app.id}`}
                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-2.5 h-2.5" /> View
                    </Link>
                    {isPending && (
                      <>
                        <ActionButton appId={app.id} action="approved" currentStatus={status} onDone={handleStatusChange} onError={handleStatusError} />
                        <ActionButton appId={app.id} action="rejected" currentStatus={status} onDone={handleStatusChange} onError={handleStatusError} />
                      </>
                    )}
                    {status === 'submitted' && (
                      <ActionButton appId={app.id} action="in_review" currentStatus={status} onDone={handleStatusChange} onError={handleStatusError} />
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
