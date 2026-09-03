'use client';

import { useState } from 'react';
import { Phone, ChevronDown, ChevronUp, Clock, XCircle, Calendar, MapPin, FileText } from 'lucide-react';

interface Applicant {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  application_status: string;
  call_notes: string | null;
  call_date: string | null;
  call_outcome: string | null;
  work_start_date: string | null;
  work_site: string | null;
  work_progress: string | null;
}

const OUTCOMES = [
  { value: 'left_voicemail',  label: 'Left Voicemail',    color: 'text-slate-600' },
  { value: 'no_answer',       label: 'No Answer',         color: 'text-slate-600' },
  { value: 'interested',      label: 'Interested',        color: 'text-blue-600'  },
  { value: 'scheduled',       label: 'Scheduled Start',   color: 'text-purple-600'},
  { value: 'enrolled',        label: 'Enrolled',          color: 'text-emerald-600'},
  { value: 'not_interested',  label: 'Not Interested',    color: 'text-red-600'   },
  { value: 'wrong_number',    label: 'Wrong Number',      color: 'text-slate-400' },
];

function OutcomePill({ outcome }: { outcome: string | null }) {
  if (!outcome) return null;
  const o = OUTCOMES.find(x => x.value === outcome);
  const label = o?.label ?? outcome;
  const color = o?.color ?? 'text-slate-500';
  return (
    <span className={`text-xs font-semibold ${color} bg-slate-50 border rounded-full px-2 py-0.5`}>
      {label}
    </span>
  );
}

export function CallListPanel({ applicants }: { applicants: Applicant[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, {
    outcome: string; notes: string; next_follow_up: string;
    work_start_date: string; work_site: string;
  }>>({});
  const [localData, setLocalData] = useState<Record<string, Partial<Applicant>>>({});

  function getForm(id: string) {
    return forms[id] ?? { outcome: '', notes: '', next_follow_up: '', work_start_date: '', work_site: '' };
  }

  function setForm(id: string, patch: Partial<typeof forms[string]>) {
    setForms(f => ({ ...f, [id]: { ...getForm(id), ...patch } }));
  }

  async function saveCall(applicant: Applicant) {
    const form = getForm(applicant.id);
    if (!form.outcome && !form.notes) return;
    setSaving(true);
    try {
      const res = await fetch('/api/program-holder/call-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_holder_student_id: applicant.id,
          outcome: form.outcome,
          notes: form.notes,
          next_follow_up: form.next_follow_up || null,
          work_start_date: form.work_start_date || null,
          work_site: form.work_site || null,
        }),
      });
      if (res.ok) {
        setSaved(applicant.id);
        setLocalData(d => ({ ...d, [applicant.id]: {
          call_notes: form.notes,
          call_outcome: form.outcome,
          work_start_date: form.work_start_date || null,
          work_site: form.work_site || null,
          call_date: new Date().toISOString(),
        }}));
        setTimeout(() => { setSaved(null); setExpanded(null); }, 1500);
      }
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...applicants].sort((a, b) => {
    // Approved first, then interested/scheduled, then rest
    const rank = (s: Applicant) => {
      const o = localData[s.id]?.call_outcome ?? s.call_outcome;
      if (s.application_status === 'approved') return 0;
      if (o === 'scheduled' || o === 'interested') return 1;
      if (o === 'enrolled') return 2;
      if (!o) return 3;
      return 4;
    };
    return rank(a) - rank(b);
  });

  return (
    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-amber-100 bg-amber-50 flex items-center justify-between">
        <h2 className="font-bold text-amber-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-amber-500" />
          Call List
          <span className="text-xs font-semibold bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 ml-1">
            {applicants.length}
          </span>
        </h2>
        <p className="text-xs text-amber-600">HVAC applicants — tap phone to call, log notes below</p>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {sorted.map((applicant) => {
          const local = localData[applicant.id] ?? {};
          const outcome = local.call_outcome ?? applicant.call_outcome;
          const notes = local.call_notes ?? applicant.call_notes;
          const workStart = local.work_start_date ?? applicant.work_start_date;
          const workSite = local.work_site ?? applicant.work_site;
          const isOpen = expanded === applicant.id;
          const isSaved = saved === applicant.id;

          return (
            <div key={applicant.id}>
              {/* Summary row */}
              <div className="px-6 py-3 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 text-sm font-bold">
                    {(applicant.applicant_name ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Name + email */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{applicant.applicant_name}</p>
                  <p className="text-xs text-slate-400 truncate">{applicant.applicant_email}</p>
                  {notes && (
                    <p className="text-xs text-slate-500 italic truncate mt-0.5">"{notes}"</p>
                  )}
                  {workStart && (
                    <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Start: {new Date(workStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {workSite && <><MapPin className="w-3 h-3 ml-1" />{workSite}</>}
                    </p>
                  )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* App status */}
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                    applicant.application_status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    applicant.application_status === 'under_review' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {applicant.application_status}
                  </span>

                  {/* Call outcome pill */}
                  {outcome && <OutcomePill outcome={outcome} />}

                  {/* Phone */}
                  {applicant.applicant_phone && (
                    <a
                      href={`tel:${applicant.applicant_phone}`}
                      className="flex items-center gap-1 text-xs font-mono text-brand-blue-600 hover:text-brand-blue-800 bg-brand-blue-50 border border-brand-blue-200 rounded-lg px-2 py-1"
                    >
                      <Phone className="w-3 h-3" />
                      {applicant.applicant_phone}
                    </a>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : applicant.id)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded call notes form */}
              {isOpen && (
                <div className="px-6 pb-5 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-4 mb-3">Log This Call</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Outcome */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Call Outcome</label>
                      <select
                        value={getForm(applicant.id).outcome}
                        onChange={e => setForm(applicant.id, { outcome: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white"
                      >
                        <option value="">Select outcome…</option>
                        {OUTCOMES.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Follow-up date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Follow-up Date</label>
                      <input
                        type="date"
                        value={getForm(applicant.id).next_follow_up}
                        onChange={e => setForm(applicant.id, { next_follow_up: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white"
                      />
                    </div>

                    {/* Work start date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Work Start Date
                      </label>
                      <input
                        type="date"
                        value={getForm(applicant.id).work_start_date}
                        onChange={e => setForm(applicant.id, { work_start_date: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white"
                      />
                    </div>

                    {/* Work site */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Work Site / Location
                      </label>
                      <input
                        type="text"
                        value={getForm(applicant.id).work_site}
                        onChange={e => setForm(applicant.id, { work_site: e.target.value })}
                        placeholder="e.g. Indianapolis North"
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Call Notes
                    </label>
                    <textarea
                      rows={3}
                      value={getForm(applicant.id).notes}
                      onChange={e => setForm(applicant.id, { notes: e.target.value })}
                      placeholder="What did you discuss? Any concerns, questions, next steps…"
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue-500 focus:outline-none bg-white resize-none"
                    />
                  </div>

                  {/* Save button */}
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      onClick={() => saveCall(applicant)}
                      disabled={saving || isSaved}
                      className="flex items-center gap-2 bg-brand-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSaved ? (
                        <><span className="w-4 h-4 rounded-full bg-brand-blue-600 inline-block flex-shrink-0" aria-hidden="true" /> Saved!</>
                      ) : saving ? (
                        <><Clock className="w-4 h-4 animate-spin" /> Saving…</>
                      ) : (
                        'Save Call Log'
                      )}
                    </button>
                    <button
                      onClick={() => setExpanded(null)}
                      className="text-sm text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
