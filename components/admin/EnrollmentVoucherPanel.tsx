'use client';

/**
 * EnrollmentVoucherPanel
 *
 * Admin UI for managing the three MOU-critical voucher timestamps on a
 * program_enrollments row. Enforces:
 *   - voucher_paid_date blocked until voucher_issued_date is set
 *   - payout_due_date auto-calculated (voucher_paid_date + 14 days)
 *   - every save is audited server-side
 *   - mark-as-paid action with confirmation
 */

import { useState } from 'react';
import {
  Calendar, CheckCircle, Clock, AlertTriangle,
  DollarSign, FileText, Save, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

export interface VoucherData {
  enrollment_id: string;
  student_name: string;
  program_name: string;
  partner_name: string | null;
  student_start_date: string | null;
  voucher_issued_date: string | null;
  voucher_paid_date: string | null;
  payout_due_date: string | null;
  payout_status: 'not_triggered' | 'pending' | 'due' | 'overdue' | 'paid';
  payout_paid_date: string | null;
  payout_paid_by_name: string | null;
  payout_notes: string | null;
  audit_log: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  changed_at: string;
  changed_by_name: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
}

const PAYOUT_STATUS_STYLES: Record<string, string> = {
  not_triggered: 'bg-slate-100 text-slate-600',
  pending:       'bg-amber-100 text-amber-800',
  due:           'bg-orange-100 text-orange-800',
  overdue:       'bg-red-100 text-red-800',
  paid:          'bg-emerald-100 text-emerald-800',
};

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  not_triggered: 'Not Triggered',
  pending:       'Pending Payout',
  due:           'Due Now',
  overdue:       'Overdue',
  paid:          'Paid',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

function toInputDate(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function EnrollmentVoucherPanel({ data }: { data: VoucherData }) {
  const [studentStart, setStudentStart]     = useState(toInputDate(data.student_start_date));
  const [voucherIssued, setVoucherIssued]   = useState(toInputDate(data.voucher_issued_date));
  const [voucherPaid, setVoucherPaid]       = useState(toInputDate(data.voucher_paid_date));
  const [notes, setNotes]                   = useState(data.payout_notes ?? '');
  const [saving, setSaving]                 = useState(false);
  const [markingPaid, setMarkingPaid]       = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [success, setSuccess]               = useState<string | null>(null);
  const [showAudit, setShowAudit]           = useState(false);
  const [localData, setLocalData]           = useState(data);

  const payoutDue = voucherPaid
    ? new Date(new Date(voucherPaid).getTime() + 14 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const isOverdue = localData.payout_due_date
    && localData.payout_status !== 'paid'
    && new Date(localData.payout_due_date) < new Date();

  async function handleSave() {
    setError(null);
    setSuccess(null);

    if (voucherPaid && !voucherIssued) {
      setError('Voucher issued date must be set before voucher paid date.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/enrollments/voucher-dates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id:       localData.enrollment_id,
          student_start_date:  studentStart || null,
          voucher_issued_date: voucherIssued || null,
          voucher_paid_date:   voucherPaid || null,
          payout_notes:        notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setLocalData(prev => ({ ...prev, ...json.enrollment, audit_log: json.audit_log }));
      setSuccess('Saved successfully.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid() {
    if (!confirm('Mark this payout as paid? This cannot be undone.')) return;
    setError(null);
    setMarkingPaid(true);
    try {
      const res = await fetch('/api/admin/enrollments/mark-payout-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: localData.enrollment_id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setLocalData(prev => ({ ...prev, ...json.enrollment, audit_log: json.audit_log }));
      setSuccess('Payout marked as paid.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Voucher &amp; Payout Tracking</h3>
            <p className="text-xs text-slate-500">{localData.student_name} · {localData.program_name}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PAYOUT_STATUS_STYLES[localData.payout_status]}`}>
          {isOverdue && localData.payout_status !== 'paid' ? 'Overdue' : PAYOUT_STATUS_LABELS[localData.payout_status]}
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Payout due date callout */}
        {localData.payout_due_date && localData.payout_status !== 'paid' && (
          <div className={`rounded-lg p-4 flex items-start gap-3 ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            {isOverdue
              ? <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className={`text-sm font-semibold ${isOverdue ? 'text-red-800' : 'text-amber-800'}`}>
                {isOverdue ? 'Payout overdue' : 'Payout due'}: {fmtDate(localData.payout_due_date)}
              </p>
              <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600' : 'text-amber-600'}`}>
                Partner: {localData.partner_name ?? '—'} · 10 business days from voucher receipt
              </p>
            </div>
          </div>
        )}

        {localData.payout_status === 'paid' && (
          <div className="rounded-lg p-4 flex items-start gap-3 bg-emerald-50 border border-emerald-200">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Payout completed {fmtDate(localData.payout_paid_date)}</p>
              {localData.payout_paid_by_name && (
                <p className="text-xs text-emerald-600 mt-0.5">Marked by {localData.payout_paid_by_name}</p>
              )}
            </div>
          </div>
        )}

        {/* Date fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Student Start Date
              <span className="ml-1 text-slate-400 font-normal">(triggers invoicing)</span>
            </label>
            <input
              type="date"
              value={studentStart}
              onChange={e => setStudentStart(e.target.value)}
              disabled={localData.payout_status === 'paid'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Voucher Issued Date
              <span className="ml-1 text-slate-400 font-normal">(required before paid date)</span>
            </label>
            <input
              type="date"
              value={voucherIssued}
              onChange={e => setVoucherIssued(e.target.value)}
              disabled={localData.payout_status === 'paid'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Voucher Paid Date
              <span className="ml-1 text-slate-400 font-normal">(starts 10-day clock)</span>
            </label>
            <input
              type="date"
              value={voucherPaid}
              onChange={e => setVoucherPaid(e.target.value)}
              disabled={!voucherIssued || localData.payout_status === 'paid'}
              title={!voucherIssued ? 'Set voucher issued date first' : ''}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            {voucherPaid && (
              <p className="text-xs text-slate-500 mt-1">
                Payout due: <span className="font-medium text-slate-700">{payoutDue}</span>
              </p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            <FileText className="w-3.5 h-3.5 inline mr-1" />
            Internal Notes / Proof of Payment
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={localData.payout_status === 'paid'}
            rows={3}
            placeholder="Reference numbers, WorkOne case IDs, confirmation details..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-400 resize-none"
          />
        </div>

        {/* Feedback */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          {localData.payout_status !== 'paid' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          )}

          {(localData.payout_status === 'pending' || localData.payout_status === 'due' || localData.payout_status === 'overdue') && (
            <button
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {markingPaid ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark Payout as Paid
            </button>
          )}
        </div>

        {/* Audit log */}
        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setShowAudit(v => !v)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700"
          >
            <Calendar className="w-3.5 h-3.5" />
            Audit Log ({localData.audit_log.length} entries)
            {showAudit ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAudit && (
            <div className="mt-3 space-y-2">
              {localData.audit_log.length === 0 ? (
                <p className="text-xs text-slate-400">No changes recorded yet.</p>
              ) : (
                localData.audit_log.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-slate-400 flex-shrink-0 w-32">
                      {new Date(entry.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex-shrink-0 font-medium text-slate-700 w-40">{entry.field_name.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400">{entry.old_value ?? '—'} → <span className="text-slate-700 font-medium">{entry.new_value ?? '—'}</span></span>
                    <span className="ml-auto text-slate-400 flex-shrink-0">{entry.changed_by_name}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
