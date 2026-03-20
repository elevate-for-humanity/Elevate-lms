'use client';

import React, { useState, useTransition } from 'react';
import { verifyFunding, rejectFunding } from './actions';

// Matches columns from v_funding_verification_queue view (migration 20260503000013)
type QueueRow = {
  enrollment_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  program_slug: string;
  funding_source: string | null;
  enrolled_at: string;
  due_at: string | null;
  days_until_due: number | null;   // negative = overdue
  days_since_enrollment: number;
  sla_status: 'on_track' | 'due_soon' | 'overdue' | 'critical' | 'no_deadline';
  has_open_escalation: boolean;
  flag_type: string | null;
};

type FilterKey = 'all' | 'critical' | 'overdue' | 'due_soon' | 'on_track';

const SLA_BADGE: Record<string, string> = {
  critical:   'bg-red-200 text-red-900',
  overdue:    'bg-red-100 text-red-800',
  due_soon:   'bg-amber-100 text-amber-800',
  on_track:   'bg-green-100 text-green-800',
  no_deadline:'bg-gray-100 text-gray-600',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all:      'All',
  critical: 'Critical',
  overdue:  'Overdue',
  due_soon: 'Due Soon',
  on_track: 'On Track',
};

export default function FundingVerificationTable({ rows }: { rows: QueueRow[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [isPending, startTransition] = useTransition();
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Per-row note state — keyed by enrollment_id
  const [noteOpen, setNoteOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filtered = filter === 'all' ? rows : rows.filter(r => r.sla_status === filter);

  function getNote(id: string) {
    return notes[id] ?? '';
  }

  function handleVerify(id: string) {
    setActionError(null);
    setActiveRow(id);
    startTransition(async () => {
      try {
        await verifyFunding(id, getNote(id));
        setNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
        setNoteOpen(null);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Verify failed');
      } finally {
        setActiveRow(null);
      }
    });
  }

  function handleReject(id: string) {
    const reason = getNote(id).trim();
    if (!reason) {
      setNoteOpen(id); // force note open
      setActionError('A reason is required before rejecting.');
      return;
    }
    setActionError(null);
    setActiveRow(id);
    startTransition(async () => {
      try {
        await rejectFunding(id, reason);
        setNotes(prev => { const n = { ...prev }; delete n[id]; return n; });
        setNoteOpen(null);
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Reject failed');
      } finally {
        setActiveRow(null);
      }
    });
  }

  function daysLabel(row: QueueRow) {
    if (row.days_until_due === null) return '—';
    if (row.days_until_due < 0) return `${Math.abs(row.days_until_due)}d overdue`;
    if (row.days_until_due === 0) return 'Due today';
    return `${row.days_until_due}d left`;
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(FILTER_LABELS) as FilterKey[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {FILTER_LABELS[f]}
            {f !== 'all' && (
              <span className="ml-1.5 text-xs opacity-75">
                ({rows.filter(r => r.sla_status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-3 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-500 text-sm">No students in this category.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Program', 'Enrolled', 'SLA', 'Deadline', ''].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider last:text-right"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(row => (
                <React.Fragment key={row.enrollment_id}>
                  <tr className={row.has_open_escalation ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {row.full_name || '—'}
                        {row.has_open_escalation && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            Escalated
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{row.email || row.user_id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{row.program_slug}</div>
                      {row.funding_source && (
                        <div className="text-xs text-gray-400">{row.funding_source}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(row.enrolled_at).toLocaleDateString()}
                      <div className="text-xs text-gray-400">{row.days_since_enrollment}d ago</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          SLA_BADGE[row.sla_status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.sla_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {daysLabel(row)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setNoteOpen(noteOpen === row.enrollment_id ? null : row.enrollment_id)}
                          className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
                        >
                          {noteOpen === row.enrollment_id ? 'Close' : 'Note'}
                        </button>
                        <button
                          onClick={() => handleVerify(row.enrollment_id)}
                          disabled={isPending && activeRow === row.enrollment_id}
                          className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => handleReject(row.enrollment_id)}
                          disabled={isPending && activeRow === row.enrollment_id}
                          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-xs"
                          title="Reason required"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                  {noteOpen === row.enrollment_id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-2">
                        <label className="block text-xs text-gray-500 mb-1">
                          Note / reason{' '}
                          <span className="text-red-500">(required for Reject)</span>
                        </label>
                        <textarea
                          value={getNote(row.enrollment_id)}
                          onChange={e =>
                            setNotes(prev => ({ ...prev, [row.enrollment_id]: e.target.value }))
                          }
                          placeholder="Document funding source, reference number, or rejection reason…"
                          rows={2}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
