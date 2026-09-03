// ARCHIVED — FSSA SNAP E&T program ended. Do not import or extend.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const EXIT_REASONS = [
  { value: 'employed',          label: 'Employed' },
  { value: 'training_complete', label: 'Training complete (not yet employed)' },
  { value: 'voluntary_exit',    label: 'Voluntary exit' },
  { value: 'non_compliance',    label: 'Non-compliance / sanction' },
  { value: 'ineligible',        label: 'No longer eligible' },
  { value: 'other',             label: 'Other' },
];

const ABAWD_EXEMPTION_REASONS = [
  'Age (under 18 or 50+)',
  'Disability / medically unfit',
  'Pregnant',
  'Caretaker of dependent child under 6',
  'Caretaker of incapacitated person',
  'Participating in drug/alcohol treatment',
  'Homeless',
  'Other',
];

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold text-slate-600 mb-1';
const sectionCls = 'border border-slate-200 rounded-xl p-4 space-y-3';

interface Props {
  participantId: string;
  initialData?: {
    exit_reason?: string | null;
    employed_at_exit?: boolean | null;
    employer_name?: string | null;
    job_title?: string | null;
    hourly_wage?: number | null;
    hours_per_week?: number | null;
    employment_start_date?: string | null;
    credential_attained?: boolean | null;
    credential_name?: string | null;
    credential_issued_date?: string | null;
    abawd_exempt?: boolean | null;
    abawd_exemption_reason?: string | null;
    exit_notes?: string | null;
  };
}

export default function ParticipantExitForm({ participantId, initialData }: Props) {
  const router = useRouter();

  const [exitReason, setExitReason] = useState(initialData?.exit_reason ?? '');
  const [exitNotes, setExitNotes] = useState(initialData?.exit_notes ?? '');
  const [employed, setEmployed] = useState(initialData?.employed_at_exit ?? false);
  const [employerName, setEmployerName] = useState(initialData?.employer_name ?? '');
  const [jobTitle, setJobTitle] = useState(initialData?.job_title ?? '');
  const [hourlyWage, setHourlyWage] = useState(initialData?.hourly_wage != null ? String(initialData.hourly_wage) : '');
  const [hoursPerWeek, setHoursPerWeek] = useState(initialData?.hours_per_week != null ? String(initialData.hours_per_week) : '');
  const [employmentStartDate, setEmploymentStartDate] = useState(initialData?.employment_start_date ?? '');
  const [credentialAttained, setCredentialAttained] = useState(initialData?.credential_attained ?? false);
  const [credentialName, setCredentialName] = useState(initialData?.credential_name ?? '');
  const [credentialIssuedDate, setCredentialIssuedDate] = useState(initialData?.credential_issued_date ?? '');
  const [abawdExempt, setAbawdExempt] = useState(initialData?.abawd_exempt ?? false);
  const [abawdReason, setAbawdReason] = useState(initialData?.abawd_exemption_reason ?? '');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exitReason) { setError('Exit reason is required.'); return; }
    if (!exitNotes.trim()) { setError('Exit case notes are required for FSSA audit compliance.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/fssa/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:                     participantId,
          enrollment_status:      'exited',
          snap_et_exited_at:      new Date().toISOString(),
          exit_reason:            exitReason,
          exit_notes:             exitNotes.trim(),
          employed_at_exit:       employed,
          employer_name:          employed ? employerName || null : null,
          job_title:              employed ? jobTitle || null : null,
          hourly_wage:            employed && hourlyWage ? parseFloat(hourlyWage) : null,
          hours_per_week:         employed && hoursPerWeek ? parseInt(hoursPerWeek, 10) : null,
          employment_start_date:  employed ? employmentStartDate || null : null,
          credential_attained:    credentialAttained,
          credential_name:        credentialAttained ? credentialName || null : null,
          credential_issued_date: credentialAttained ? credentialIssuedDate || null : null,
          abawd_exempt:           abawdExempt,
          abawd_exemption_reason: abawdExempt ? abawdReason || null : null,
        }),
      });

      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to record exit.'); return; }
      setSuccess(true);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Exit recorded. Q2 and Q4 follow-up dates scheduled automatically.
        </div>
        <p className="text-xs text-slate-500">Refresh to see the updated participant record.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-700">{error}</p>
        </div>
      )}

      {/* Exit details */}
      <div className={sectionCls}>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Exit Details</h4>
        <div>
          <label className={labelCls}>Exit reason <span className="text-rose-500">*</span></label>
          <select className={inputCls} value={exitReason} onChange={e => setExitReason(e.target.value)} required>
            <option value="">Select reason…</option>
            {EXIT_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>
            Exit case notes <span className="text-rose-500">*</span>
            <span className="text-slate-400 font-normal ml-1">(required for FSSA audit)</span>
          </label>
          <textarea
            className={inputCls}
            value={exitNotes}
            onChange={e => setExitNotes(e.target.value)}
            rows={3}
            placeholder="Document the circumstances of exit, final contacts, and next steps discussed with participant…"
            required
          />
        </div>
      </div>

      {/* Employment at exit */}
      <div className={sectionCls}>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Employment at Exit</h4>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={employed} onChange={e => setEmployed(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Employed at exit
        </label>
        {employed && (
          <div className="space-y-3 pl-3 border-l-2 border-emerald-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Employer name</label>
                <input className={inputCls} value={employerName} onChange={e => setEmployerName(e.target.value)} placeholder="Acme HVAC" />
              </div>
              <div>
                <label className={labelCls}>Job title</label>
                <input className={inputCls} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="HVAC Technician" />
              </div>
              <div>
                <label className={labelCls}>Hourly wage ($)</label>
                <input type="number" className={inputCls} value={hourlyWage} onChange={e => setHourlyWage(e.target.value)} min="0" step="0.01" placeholder="22.00" />
              </div>
              <div>
                <label className={labelCls}>Hours / week</label>
                <input type="number" className={inputCls} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} min="0" max="80" placeholder="40" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Employment start date</label>
              <input type="date" className={inputCls} value={employmentStartDate} onChange={e => setEmploymentStartDate(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Credential */}
      <div className={sectionCls}>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Credential / Training Outcome</h4>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={credentialAttained} onChange={e => setCredentialAttained(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Credential attained during program
        </label>
        {credentialAttained && (
          <div className="space-y-3 pl-3 border-l-2 border-blue-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Credential name</label>
                <input className={inputCls} value={credentialName} onChange={e => setCredentialName(e.target.value)} placeholder="EPA 608 Certification" />
              </div>
              <div>
                <label className={labelCls}>Date issued</label>
                <input type="date" className={inputCls} value={credentialIssuedDate} onChange={e => setCredentialIssuedDate(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ABAWD */}
      <div className={sectionCls}>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">ABAWD Status</h4>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={abawdExempt} onChange={e => setAbawdExempt(e.target.checked)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          ABAWD exempt at exit
        </label>
        {abawdExempt && (
          <div className="pl-3 border-l-2 border-amber-200">
            <label className={labelCls}>Exemption reason</label>
            <select className={inputCls} value={abawdReason} onChange={e => setAbawdReason(e.target.value)}>
              <option value="">Select reason…</option>
              {ABAWD_EXEMPTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Follow-up schedule preview */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-600 uppercase tracking-wide hover:bg-slate-50 transition"
        >
          Follow-up schedule (auto-calculated on save)
          {showFollowUp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showFollowUp && (
          <div className="px-4 pb-4 space-y-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 pt-2">Calculated from today&apos;s exit date and saved automatically.</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="text-xs text-slate-400 block mb-0.5">Q2 follow-up</span>
                <span className="text-sm font-semibold">
                  {new Date(Date.now() + 180 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">~6 months post-exit</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <span className="text-xs text-slate-400 block mb-0.5">Q4 follow-up</span>
                <span className="text-sm font-semibold">
                  {new Date(Date.now() + 365 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-slate-400 block mt-0.5">~12 months post-exit</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Record Exit'}
      </button>
    </form>
  );
}
