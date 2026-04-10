'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface EligibilityReview {
  id: string;
  application_id: string;
  funding_snap: boolean | null;
  funding_tanf: boolean | null;
  referral_partner: boolean | null;
  referral_source: string | null;
  case_manager_name: string | null;
  case_manager_email: string | null;
  other_funding_source: string | null;
  age_confirmed: boolean | null;
  indiana_resident: boolean | null;
  education_level: string | null;
  has_diploma_or_ged: boolean | null;
  enrolled_in_ged_program: boolean | null;
  work_authorized: boolean | null;
  active_warrant: boolean | null;
  pending_charges: boolean | null;
  probation_or_parole: boolean | null;
  legal_notes: string | null;
  can_attend_schedule: boolean | null;
  has_transportation_plan: boolean | null;
  can_meet_physical: boolean | null;
  willing_to_follow_rules: boolean | null;
  willing_job_readiness: boolean | null;
  unavailable_times: string | null;
  motivation: string | null;
  support_needs_transport: boolean;
  support_needs_other: boolean;
  agrees_attendance_policy: boolean;
  agrees_verification_policy: boolean;
  eligibility_status: 'eligible' | 'conditional_review' | 'ineligible' | 'incomplete';
  eligibility_reason_codes: string[];
  reviewer_decision: string | null;
  reviewer_notes: string | null;
  reviewer_name: string | null;
  reviewed_at: string | null;
  enrollment_conditions: { condition: string; deadline?: string }[];
  condition_deadline: string | null;
}

interface Props {
  review: EligibilityReview | null;
  applicationId: string;
}

const REASON_CODE_LABELS: Record<string, string> = {
  UNDER_18: 'Under 18 years old',
  NON_INDIANA_RESIDENT: 'Not an Indiana resident',
  NO_WORK_AUTH: 'Not authorized to work in the U.S.',
  ACTIVE_WARRANT: 'Active warrant',
  ATTENDANCE_CONFLICT: 'Cannot attend required training hours',
  ACKNOWLEDGMENT_MISSING: 'Did not accept required acknowledgments',
  NO_QUALIFYING_FUNDING: 'No qualifying funding source (SNAP/TANF/referral)',
  NO_DIPLOMA_GED_REVIEW: 'No diploma or GED — not enrolled in GED program',
  GED_IN_PROGRESS_REVIEW: 'GED in progress — requires documentation',
  PENDING_CHARGES_REVIEW: 'Pending criminal charges — case-by-case review',
  PROBATION_PAROLE_REVIEW: 'On probation or parole — case-by-case review',
  TRANSPORTATION_REVIEW: 'No reliable transportation — support services review needed',
  PHYSICAL_READINESS_REVIEW: 'Physical readiness concern — review needed',
};

function BoolBadge({ value, label }: { value: boolean | null; label: string }) {
  if (value === null) return <span className="text-slate-400 text-xs">{label}: —</span>;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      {value ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

const statusConfig = {
  eligible: { label: 'Eligible', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  conditional_review: { label: 'Conditional Review', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: AlertCircle },
  ineligible: { label: 'Ineligible', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  incomplete: { label: 'Incomplete', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertCircle },
};

const decisionConfig = {
  enroll: { label: 'Enroll', color: 'bg-green-600 hover:bg-green-700 text-white' },
  hold: { label: 'Hold — Pending Docs', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
  do_not_enroll: { label: 'Do Not Enroll', color: 'bg-red-600 hover:bg-red-700 text-white' },
};

export default function EligibilityReviewPanel({ review, applicationId }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [decision, setDecision] = useState(review?.reviewer_decision || '');
  const [notes, setNotes] = useState(review?.reviewer_notes || '');
  const [condition, setCondition] = useState('');
  const [conditions, setConditions] = useState<string[]>(
    review?.enrollment_conditions?.map((c: { condition: string }) => c.condition) || []
  );
  const [conditionDeadline, setConditionDeadline] = useState(review?.condition_deadline || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  if (!review) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm text-slate-500">No eligibility screening data submitted for this application.</p>
      </div>
    );
  }

  const status = statusConfig[review.eligibility_status] || statusConfig.incomplete;
  const StatusIcon = status.icon;

  async function handleSave() {
    if (!decision) { setError('Select a decision before saving.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/applications/eligibility-review', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          reviewer_decision: decision,
          reviewer_notes: notes,
          enrollment_conditions: conditions.map(c => ({ condition: c })),
          condition_deadline: conditionDeadline || null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">Eligibility Screening</h3>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${status.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>
          {review.support_needs_transport && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium">
              🚌 Transport support needed
            </span>
          )}
          {review.support_needs_other && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-xs font-medium">
              🤝 Other support needed
            </span>
          )}
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-slate-400 hover:text-slate-600 transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Reason codes */}
      {review.eligibility_reason_codes?.length > 0 && (
        <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex flex-wrap gap-2">
          {review.eligibility_reason_codes.map(code => (
            <span key={code} className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
              {REASON_CODE_LABELS[code] || code}
            </span>
          ))}
        </div>
      )}

      {/* Expanded screening answers */}
      {expanded && (
        <div className="p-5 space-y-5 border-b border-slate-100">

          {/* Funding */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Funding & Referral</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.funding_snap} label="SNAP" />
              <BoolBadge value={review.funding_tanf} label="TANF" />
              <BoolBadge value={review.referral_partner} label="WorkOne/IMPACT referral" />
            </div>
            {review.case_manager_name && <p className="text-xs text-slate-600 mt-2">Case manager: <strong>{review.case_manager_name}</strong>{review.case_manager_email ? ` — ${review.case_manager_email}` : ''}</p>}
            {review.referral_source && <p className="text-xs text-slate-600">Referral source: {review.referral_source}</p>}
            {review.other_funding_source && <p className="text-xs text-slate-600">Other funding: {review.other_funding_source}</p>}
          </div>

          {/* Residency / Age */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Residency & Age</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.age_confirmed} label="18+" />
              <BoolBadge value={review.indiana_resident} label="Indiana resident" />
            </div>
          </div>

          {/* Education */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Education</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.has_diploma_or_ged} label="Diploma/GED" />
              {review.has_diploma_or_ged === false && <BoolBadge value={review.enrolled_in_ged_program} label="GED in progress" />}
            </div>
            {review.education_level && <p className="text-xs text-slate-600 mt-1">Level: {review.education_level.replace(/_/g, ' ')}</p>}
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Legal</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.work_authorized} label="Work authorized" />
              <BoolBadge value={review.active_warrant === null ? null : !review.active_warrant} label="No active warrant" />
              <BoolBadge value={review.pending_charges === null ? null : !review.pending_charges} label="No pending charges" />
              <BoolBadge value={review.probation_or_parole === null ? null : !review.probation_or_parole} label="Not on probation/parole" />
            </div>
            {review.legal_notes && <p className="text-xs text-slate-600 mt-2 italic">{review.legal_notes}</p>}
          </div>

          {/* Readiness */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Program Readiness</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.can_attend_schedule} label="Can attend schedule" />
              <BoolBadge value={review.has_transportation_plan} label="Has transportation" />
              <BoolBadge value={review.can_meet_physical} label="Physical readiness" />
              <BoolBadge value={review.willing_to_follow_rules} label="Willing to follow rules" />
              <BoolBadge value={review.willing_job_readiness} label="Job readiness" />
            </div>
            {review.unavailable_times && <p className="text-xs text-slate-600 mt-2">Unavailable: {review.unavailable_times}</p>}
            {review.motivation && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-1">Motivation:</p>
                <p className="text-xs text-slate-700 italic">&ldquo;{review.motivation}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Acknowledgments */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Acknowledgments</p>
            <div className="flex flex-wrap gap-2">
              <BoolBadge value={review.agrees_attendance_policy} label="Attendance policy" />
              <BoolBadge value={review.agrees_verification_policy} label="Verification policy" />
            </div>
          </div>
        </div>
      )}

      {/* Staff decision */}
      <div className="p-5 space-y-4">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Staff Decision</p>

        {review.reviewer_decision && !saved && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            Previously decided: <strong className="text-slate-700">{decisionConfig[review.reviewer_decision as keyof typeof decisionConfig]?.label || review.reviewer_decision}</strong>
            {review.reviewer_name && <> by {review.reviewer_name}</>}
            {review.reviewed_at && <> on {new Date(review.reviewed_at).toLocaleDateString()}</>}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 text-xs text-green-700 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Decision saved and applicant notified.
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {Object.entries(decisionConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setDecision(key); setSaved(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors border-2 ${decision === key ? cfg.color + ' border-transparent' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes for applicant (included in notification email)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="e.g. Must provide SNAP verification within 7 days of enrollment..."
          />
        </div>

        {/* Enrollment conditions */}
        {decision === 'enroll' || decision === 'hold' ? (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Enrollment conditions (optional)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="e.g. Must confirm transportation plan before start date"
              />
              <button
                type="button"
                onClick={() => { if (condition.trim()) { setConditions(c => [...c, condition.trim()]); setCondition(''); } }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
            {conditions.length > 0 && (
              <ul className="space-y-1">
                {conditions.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg">
                    <span>{c}</span>
                    <button onClick={() => setConditions(cs => cs.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 ml-2">✕</button>
                  </li>
                ))}
              </ul>
            )}
            {conditions.length > 0 && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Condition deadline</label>
                <input type="date" value={conditionDeadline} onChange={e => setConditionDeadline(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
            )}
          </div>
        ) : null}

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !decision}
          className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Saving...' : 'Save Decision & Notify Applicant'}
        </button>
      </div>
    </div>
  );
}
