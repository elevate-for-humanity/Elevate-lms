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
  program_id: string | null;
  program_slug: string | null;
  support_notes: string | null;
  status: string;
  source: string | null;
  type: string | null;
  created_at: string;
  updated_at: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  in_review: 'In Review',
  under_review: 'Under Review',
  approved: 'Approved',
  ready_to_enroll: 'Ready to Enroll',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  pending_workone: 'Pending WorkOne',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-indigo-100 text-indigo-800',
  under_review: 'bg-violet-100 text-violet-800',
  approved: 'bg-emerald-100 text-emerald-800',
  ready_to_enroll: 'bg-cyan-100 text-cyan-800',
  enrolled: 'bg-teal-100 text-teal-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-purple-100 text-purple-800',
  pending_workone: 'bg-orange-100 text-orange-800',
  pending_admin_review: 'bg-amber-100 text-amber-800',
  pending_funding: 'bg-orange-100 text-orange-900',
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
    approved: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    rejected: 'bg-red-100 text-red-700 hover:bg-red-200',
    in_review: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
  };
  const icons = {
    approved: <CheckCircle className="w-2.5 h-2.5" />,
    rejected: <XCircle className="w-2.5 h-2.5" />,
    in_review: <Eye className="w-2.5 h-2.5" />,
  };

  if (currentStatus === action) return null;

  function handleClick() {
    startTransition(async () => {
      try {
        const isApprove = action === 'approved';
        const endpoint = isApprove
          ? `/api/admin/applications/${appId}/approve`
          : `/api/admin/applications/${appId}`;
        const method = isApprove ? 'POST' : 'PATCH';
        const body = isApprove ? {} : { status: action };

        const res = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          onDone(appId, action);
        } else {
          const body = await res.json().catch(() => null);
          onError(
            appId,
            body?.error ?? `Failed to ${labels[action].toLowerCase()} (${res.status})`,
          );
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

export default function ApplicationsTableClient({
  applications,
}: {
  applications: ApplicationRow[];
}) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  function handleStatusChange(id: string, newStatus: string) {
    setOverrides((prev) => ({ ...prev, [id]: newStatus }));
    setRowError((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    router.refresh();
  }

  function handleStatusError(id: string, msg: string) {
    setRowError((prev) => ({ ...prev, [id]: msg }));
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
              Applicant
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
              Program
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {applications.map((app) => {
            const displayName =
              [app.first_name, app.last_name].filter(Boolean).join(' ') ||
              app.full_name ||
              'Unknown';
            const status = overrides[app.id] ?? app.status;
            const isActionable = [
              'pending',
              'submitted',
              'in_review',
              'under_review',
              'pending_workone',
              'waitlisted',
            ].includes(status);
            const canMoveToReview = ['submitted', 'pending'].includes(status);

            return (
              <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-sm text-slate-900">{displayName}</div>
                  {app.city && (
                    <div className="text-xs text-slate-700">
                      {app.city}
                      {app.zip ? `, ${app.zip}` : ''}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{app.email || 'N/A'}</div>
                  {app.phone && <div className="text-xs text-slate-700">{app.phone}</div>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {app.program_interest || app.program_slug?.replace(/-/g, ' ') || <span className="text-slate-700">Not specified</span>}
                  {app.program_slug && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{app.program_slug}</div>
                  )}
                  {!app.program_id && !app.program_slug && !['rejected', 'waitlisted'].includes(status) && (
                    <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                      ⚠ No program linked
                    </div>
                  )}
                  {app.source && (
                    <div className="text-xs text-slate-700">{app.source.replace(/-/g, ' ')}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-900'}`}
                  >
                    {STATUS_LABELS[status] || status}
                  </span>
                  {rowError[app.id] && (
                    <div className="text-[10px] text-red-600 mt-0.5">{rowError[app.id]}</div>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                  {new Date(app.created_at).toLocaleDateString('en-US')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app.id) ? (
                      <Link
                        href={`/admin/applications/review/${app.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-slate-100 text-slate-900 hover:bg-slate-200 transition-colors"
                      >
                        <Eye className="w-2.5 h-2.5" /> View
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/applications/review/${app.id}${app.email ? `?email=${encodeURIComponent(app.email)}` : ''}`}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                        title="Legacy intake record — load from apprenticeship intake fallback"
                      >
                        <Eye className="w-2.5 h-2.5" /> View Intake
                      </Link>
                    )}
                    {isActionable && (
                      <>
                        <ActionButton
                          appId={app.id}
                          action="approved"
                          currentStatus={status}
                          onDone={handleStatusChange}
                          onError={handleStatusError}
                        />
                        <ActionButton
                          appId={app.id}
                          action="rejected"
                          currentStatus={status}
                          onDone={handleStatusChange}
                          onError={handleStatusError}
                        />
                      </>
                    )}
                    {canMoveToReview && (
                      <ActionButton
                        appId={app.id}
                        action="in_review"
                        currentStatus={status}
                        onDone={handleStatusChange}
                        onError={handleStatusError}
                      />
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
