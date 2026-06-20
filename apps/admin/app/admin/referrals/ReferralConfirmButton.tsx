'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  referralId: string;
  participantName: string;
  currentStatus: string;
  partnerAcknowledged: boolean;
}

type ConfirmationType =
  | 'receipt'
  | 'enrollment'
  | 'attendance'
  | 'completion'
  | 'placement'
  | 'no_show'
  | 'declined'
  | 'unable_to_reach';

const CONFIRMATION_OPTIONS: { value: ConfirmationType; label: string; description: string }[] = [
  { value: 'receipt',         label: 'Receipt confirmed',    description: 'Partner confirmed they received the referral' },
  { value: 'enrollment',      label: 'Enrolled',             description: 'Partner confirmed participant enrolled' },
  { value: 'attendance',      label: 'Attending',            description: 'Partner confirmed attendance / participation' },
  { value: 'completion',      label: 'Completed',            description: 'Partner confirmed program completion' },
  { value: 'placement',       label: 'Placed',               description: 'Partner confirmed job placement' },
  { value: 'no_show',         label: 'No-show',              description: 'Participant did not show up' },
  { value: 'declined',        label: 'Declined',             description: 'Partner declined the referral' },
  { value: 'unable_to_reach', label: 'Unable to reach',      description: 'Could not reach partner — log for follow-up' },
];

const METHOD_OPTIONS = ['email', 'phone', 'portal', 'in_person', 'fax', 'other'] as const;

export default function ReferralConfirmButton({
  referralId,
  participantName,
  currentStatus,
  partnerAcknowledged,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [confirmationType, setConfirmationType] = useState<ConfirmationType>('receipt');
  const [method, setMethod] = useState<string>('email');
  const [confirmedByName, setConfirmedByName] = useState('');
  const [confirmedByEmail, setConfirmedByEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [placementDate, setPlacementDate] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [hourlyWage, setHourlyWage] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDueDate, setFollowUpDueDate] = useState('');

  async function submit() {
    setSaving(true);
    setError('');

    const body: Record<string, unknown> = {
      referral_id:        referralId,
      confirmation_type:  confirmationType,
      confirmation_method: method,
      confirmed_by_name:  confirmedByName || null,
      confirmed_by_email: confirmedByEmail || null,
      notes:              notes || null,
      follow_up_required: followUpRequired,
      follow_up_due_date: followUpDueDate || null,
    };

    if (confirmationType === 'enrollment' && enrollmentDate) body.enrollment_date = enrollmentDate;
    if (confirmationType === 'completion' && completionDate) body.completion_date = completionDate;
    if (confirmationType === 'placement') {
      if (placementDate)  body.placement_date  = placementDate;
      if (employerName)   body.employer_name   = employerName;
      if (jobTitle)       body.job_title       = jobTitle;
      if (hourlyWage)     body.hourly_wage     = parseFloat(hourlyWage);
    }

    const res = await fetch('/api/admin/referrals/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? 'Failed to save confirmation');
    }
    setSaving(false);
  }

  const isDone = currentStatus === 'completed' || currentStatus === 'cancelled';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={isDone}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
          isDone
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : partnerAcknowledged
              ? 'border border-slate-200 text-slate-600 hover:border-slate-300'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {partnerAcknowledged ? 'Log update' : 'Log confirmation'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-4">
            <h3 className="font-bold text-slate-900 mb-1">Log Partner Confirmation</h3>
            <p className="text-sm text-slate-500 mb-5">
              Recording a confirmation for <strong>{participantName}</strong>. Every contact must
              be logged — this is your audit trail.
            </p>

            {/* Confirmation type */}
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Confirmation type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {CONFIRMATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfirmationType(opt.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
                    confirmationType === opt.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold block">{opt.label}</span>
                  <span className="text-slate-400">{opt.description}</span>
                </button>
              ))}
            </div>

            {/* Method */}
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contact method <span className="text-red-500">*</span>
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {METHOD_OPTIONS.map((m) => (
                <option key={m} value={m}>{m.replace('_', ' ')}</option>
              ))}
            </select>

            {/* Partner contact */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Partner contact name
                </label>
                <input
                  type="text"
                  value={confirmedByName}
                  onChange={(e) => setConfirmedByName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Partner contact email
                </label>
                <input
                  type="email"
                  value={confirmedByEmail}
                  onChange={(e) => setConfirmedByEmail(e.target.value)}
                  placeholder="jane@agency.org"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Outcome fields — shown conditionally */}
            {confirmationType === 'enrollment' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Enrollment date</label>
                <input
                  type="date"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            )}

            {confirmationType === 'completion' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">Completion date</label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            )}

            {confirmationType === 'placement' && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Placement date</label>
                  <input
                    type="date"
                    value={placementDate}
                    onChange={(e) => setPlacementDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Hourly wage ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={hourlyWage}
                    onChange={(e) => setHourlyWage(e.target.value)}
                    placeholder="18.50"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Employer name</label>
                  <input
                    type="text"
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="HVAC Technician"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Notes — required for audit */}
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Case notes <span className="text-red-500">*</span>
              <span className="text-slate-400 font-normal ml-1">(required for audit)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Spoke with Jane at WorkOne Indianapolis. Confirmed participant attended orientation on..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            />

            {/* Follow-up */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="follow_up"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="follow_up" className="text-sm text-slate-700">
                Follow-up required
              </label>
              {followUpRequired && (
                <input
                  type="date"
                  value={followUpDueDate}
                  onChange={(e) => setFollowUpDueDate(e.target.value)}
                  className="ml-2 px-2 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              )}
            </div>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={submit}
                disabled={saving || !notes.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Save confirmation
                  </>
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2 rounded-lg text-sm hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
