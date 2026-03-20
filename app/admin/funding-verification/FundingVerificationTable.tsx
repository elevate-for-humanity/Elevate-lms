'use client';

import React, { useState, useTransition } from 'react';
import { verifyFunding, rejectFunding } from './actions';

type QueueRow = {
  enrollment_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  program_name: string | null;
  enrolled_at: string;
  days_remaining: number;
  sla_status: string;
};

type FilterKey = 'all' | 'overdue' | 'at_risk' | 'on_track';

const SLA_BADGE: Record<string, string> = {
  overdue:  'bg-red-100 text-red-800',
  at_risk:  'bg-amber-100 text-amber-800',
  on_track: 'bg-green-100 text-green-800',
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all:      'All',
  overdue:  'Overdue',
  at_risk:  'At Risk',
  on_track: 'On Track',
};

export default function FundingVerificationTable({ rows }: { rows: QueueRow[] }) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [isPending, startTransition] = useTransition();
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [noteRow, setNoteRow] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const filtered = filter === 'all' ? rows : rows.filter(r => r.sla_status === filter);

  function handleVerify(id: string) {
    setActiveRow(id);
    startTransition(async () => {
      await verifyFunding(id, note);
      setActiveRow(null);
      setNote('');
      setNoteRow(null);
    });
  }

  function handleReject(id: string) {
    setActiveRow(id);
    startTransition(async () => {
      await rejectFunding(id, note);
      setActiveRow(null);
      setNote('');
      setNoteRow(null);
    });
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

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-gray-500 text-sm">No students in this category.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Student', 'Program', 'Enrolled', 'SLA', 'Days Left', ''].map(h => (
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
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.full_name || '—'}</div>
                      <div className="text-xs text-gray-500">{row.email || row.user_id}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.program_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(row.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          SLA_BADGE[row.sla_status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.sla_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {row.days_remaining > 0 ? (
                        `${row.days_remaining}d`
                      ) : (
                        <span className="text-red-600 font-medium">Overdue</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setNoteRow(noteRow === row.enrollment_id ? null : row.enrollment_id)
                          }
                          className="px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs"
                        >
                          Note
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
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                  {noteRow === row.enrollment_id && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-2">
                        <textarea
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder="Optional note (saved to audit log)…"
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
