'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Calendar, CheckCircle, XCircle, RefreshCw, ChevronDown } from 'lucide-react';

interface QueueRow {
  authorization_id: string;
  user_id: string;
  program_id: string;
  status: string;
  authorized_at: string | null;
  expires_at: string | null;
  notes: string | null;
  learner_email: string;
  learner_name: string;
  program_slug: string;
  program_title: string;
  scheduled_date: string | null;
  testing_center: string | null;
  scheduling_outcome: string | null;
  exam_passed: boolean | null;
  exam_score: number | null;
  exam_date: string | null;
  days_until_expiry: number | null;
  expiring_soon: boolean;
  action_needed: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  needs_scheduling:     { label: 'Schedule Exam',       color: 'bg-blue-100 text-blue-800' },
  awaiting_outcome:     { label: 'Awaiting Outcome',    color: 'bg-yellow-100 text-yellow-800' },
  needs_result_recorded:{ label: 'Record Result',       color: 'bg-green-100 text-green-800' },
  eligible_for_reauth:  { label: 'Re-authorize',        color: 'bg-purple-100 text-purple-800' },
  no_action_needed:     { label: 'No Action',           color: 'bg-gray-100 text-gray-500' },
};

const STATUS_COLORS: Record<string, string> = {
  authorized: 'bg-blue-100 text-blue-700',
  scheduled:  'bg-yellow-100 text-yellow-700',
  passed:     'bg-green-100 text-green-700',
  failed:     'bg-red-100 text-red-700',
  expired:    'bg-gray-100 text-gray-500',
  no_show:    'bg-orange-100 text-orange-700',
};

export default function ExamAuthWorkQueue({
  rows,
  currentUserId,
}: {
  rows: QueueRow[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const filtered = filter === 'all'
    ? rows
    : filter === 'stuck'
    ? rows.filter(r =>
        r.action_needed === 'needs_scheduling' &&
        r.authorized_at &&
        (Date.now() - new Date(r.authorized_at).getTime()) > 5 * 24 * 60 * 60 * 1000
      )
    : rows.filter(r => r.action_needed === filter);

  function daysSince(dateStr: string | null): number {
    if (!dateStr) return 0;
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  function isStuck(row: QueueRow): boolean {
    return row.action_needed === 'needs_scheduling' && daysSince(row.authorized_at) > 5;
  }

  async function handleAction(authId: string, action: string, payload?: Record<string, string>) {
    setActionState(s => ({ ...s, [authId]: 'loading' }));

    try {
      let url = '';
      const method = 'POST';
      let body: Record<string, unknown> = {};

      switch (action) {
        case 'schedule':
          url = `/api/admin/exam-authorizations/${authId}/schedule`;
          body = payload ?? {};
          break;
        case 'mark_sat':
          url = `/api/admin/exam-authorizations/${authId}/outcome`;
          body = { outcome: 'sat' };
          break;
        case 'mark_no_show':
          url = `/api/admin/exam-authorizations/${authId}/outcome`;
          body = { outcome: 'no_show' };
          break;
        case 'record_result':
          url = `/api/admin/exam-authorizations/${authId}/result`;
          body = payload ?? {};
          break;
        case 'reauthorize':
          url = `/api/admin/exam-authorizations/${authId}/reauthorize`;
          break;
        case 'expire':
          url = `/api/admin/exam-authorizations/${authId}/expire`;
          break;
        default:
          return;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setActionState(s => ({ ...s, [authId]: `error: ${data.error ?? 'failed'}` }));
      } else {
        setActionState(s => ({ ...s, [authId]: 'done' }));
        // Reload to reflect updated queue state
        startTransition(() => { window.location.reload(); });
      }
    } catch {
      setActionState(s => ({ ...s, [authId]: 'error: network failure' }));
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Filter bar */}
      <div className="border-b border-gray-200 px-4 py-3 flex flex-wrap gap-2">
        {[
          { key: 'all',                   label: `All (${rows.length})` },
          { key: 'needs_scheduling',      label: 'Needs Scheduling' },
          { key: 'stuck',                 label: '⚠ Stuck > 5d' },
          { key: 'awaiting_outcome',      label: 'Awaiting Outcome' },
          { key: 'needs_result_recorded', label: 'Record Result' },
          { key: 'eligible_for_reauth',   label: 'Re-authorize' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 text-center text-gray-500 text-sm">
          No items in this view.
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authorized</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(row => {
              const stuck = isStuck(row);
              const actionInfo = ACTION_LABELS[row.action_needed] ?? ACTION_LABELS.no_action_needed;
              const state = actionState[row.authorization_id];
              const expanded = expandedId === row.authorization_id;

              return (
                <>
                  <tr
                    key={row.authorization_id}
                    className={`${stuck ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    {/* Learner */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.learner_name}</div>
                      <div className="text-xs text-gray-400">{row.learner_email}</div>
                    </td>

                    {/* Program */}
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{row.program_title}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[row.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {row.status}
                      </span>
                      {stuck && (
                        <span className="ml-1 inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          {daysSince(row.authorized_at)}d
                        </span>
                      )}
                    </td>

                    {/* Authorized */}
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {row.authorized_at ? new Date(row.authorized_at).toLocaleDateString() : '—'}
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3 text-xs">
                      {row.expires_at ? (
                        <span className={row.expiring_soon ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                          {new Date(row.expires_at).toLocaleDateString()}
                          {row.days_until_expiry !== null && (
                            <span className="ml-1 text-gray-400">({row.days_until_expiry}d)</span>
                          )}
                        </span>
                      ) : '—'}
                    </td>

                    {/* Next action badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                        {actionInfo.label}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {state === 'loading' && (
                          <span className="text-xs text-gray-400">Saving…</span>
                        )}
                        {state?.startsWith('error') && (
                          <span className="text-xs text-red-500">{state}</span>
                        )}
                        {!state && (
                          <>
                            {row.action_needed === 'needs_scheduling' && (
                              <button
                                onClick={() => setExpandedId(expanded ? null : row.authorization_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                <Calendar className="w-3 h-3" />
                                Schedule
                                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                            {row.action_needed === 'awaiting_outcome' && (
                              <>
                                <button
                                  onClick={() => handleAction(row.authorization_id, 'mark_sat')}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  Sat
                                </button>
                                <button
                                  onClick={() => handleAction(row.authorization_id, 'mark_no_show')}
                                  className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                >
                                  No-show
                                </button>
                              </>
                            )}
                            {row.action_needed === 'needs_result_recorded' && (
                              <button
                                onClick={() => setExpandedId(expanded ? null : row.authorization_id)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Record Result
                                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                            {row.action_needed === 'eligible_for_reauth' && (
                              <button
                                onClick={() => handleAction(row.authorization_id, 'reauthorize')}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Re-auth
                              </button>
                            )}
                            {['authorized', 'scheduled'].includes(row.status) && (
                              <button
                                onClick={() => handleAction(row.authorization_id, 'expire')}
                                className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300"
                              >
                                Expire
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded inline form */}
                  {expanded && (
                    <tr key={`${row.authorization_id}-expanded`} className="bg-gray-50">
                      <td colSpan={7} className="px-4 py-4">
                        {row.action_needed === 'needs_scheduling' && (
                          <ScheduleForm
                            authId={row.authorization_id}
                            onSubmit={(payload) => {
                              setExpandedId(null);
                              handleAction(row.authorization_id, 'schedule', payload);
                            }}
                            onCancel={() => setExpandedId(null)}
                          />
                        )}
                        {row.action_needed === 'needs_result_recorded' && (
                          <RecordResultForm
                            authId={row.authorization_id}
                            onSubmit={(payload) => {
                              setExpandedId(null);
                              handleAction(row.authorization_id, 'record_result', payload);
                            }}
                            onCancel={() => setExpandedId(null)}
                          />
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ScheduleForm({
  authId,
  onSubmit,
  onCancel,
}: {
  authId: string;
  onSubmit: (payload: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [center, setCenter] = useState('');
  const [confirmation, setConfirmation] = useState('');

  return (
    <div className="max-w-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Exam</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Exam Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Testing Center</label>
          <input type="text" value={center} onChange={e => setCenter(e.target.value)}
            placeholder="Location or proctor name"
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Confirmation #</label>
          <input type="text" value={confirmation} onChange={e => setConfirmation(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSubmit({ scheduled_date: date, scheduled_time: time, testing_center: center, confirmation_number: confirmation })}
          disabled={!date}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Save Schedule
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </div>
  );
}

function RecordResultForm({
  authId,
  onSubmit,
  onCancel,
}: {
  authId: string;
  onSubmit: (payload: Record<string, string>) => void;
  onCancel: () => void;
}) {
  const [passed, setPassed] = useState<string>('');
  const [score, setScore] = useState('');
  const [examDate, setExamDate] = useState('');
  const [certNumber, setCertNumber] = useState('');

  return (
    <div className="max-w-lg">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Record Exam Result</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Result *</label>
          <select value={passed} onChange={e => setPassed(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">Select…</option>
            <option value="true">Passed</option>
            <option value="false">Failed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Score (%)</label>
          <input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Exam Date *</label>
          <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Certificate # (if passed)</label>
          <input type="text" value={certNumber} onChange={e => setCertNumber(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSubmit({ passed, score, exam_date: examDate, certificate_number: certNumber })}
          disabled={!passed || !examDate}
          className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
        >
          Save Result
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300">
          Cancel
        </button>
      </div>
    </div>
  );
}
