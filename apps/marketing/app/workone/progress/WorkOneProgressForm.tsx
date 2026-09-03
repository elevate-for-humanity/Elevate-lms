'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ProgressData {
  referenceNumber?: string;
  applicantName?: string;
  applicantEmail?: string;
  programSlug?: string;
  programName?: string;
  programCode?: string | null;
  progressStatus?: string;
  fundingStatus?: string | null;
  appointmentDate?: string | null;
  workoneCenter?: string | null;
  caseManagerName?: string | null;
  caseManagerEmail?: string | null;
  approvalReference?: string | null;
  feedback?: string | null;
  wantsCallback?: boolean;
  updatedAt?: string | null;
}

const STATUS_OPTIONS = [
  ['not_started', 'I have not started yet'],
  ['needs_appointment', 'I need to schedule my WorkOne appointment'],
  ['appointment_scheduled', 'My WorkOne appointment is scheduled'],
  ['attended', 'I attended my WorkOne appointment'],
  ['funding_submitted', 'My funding request was submitted / I am waiting on a decision'],
  ['approved', 'My funding was approved'],
  ['denied', 'My funding was denied'],
  ['need_help', 'I need help from Elevate'],
] as const;

export default function WorkOneProgressForm({ token }: { token: string }) {
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/workone/progress?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
          credentials: 'same-origin',
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Unable to load your WorkOne progress form.');
        if (active) setProgress(data.progress || {});
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load your WorkOne progress form.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [token]);

  function setField<K extends keyof ProgressData>(field: K, value: ProgressData[K]) {
    setProgress((current) => ({ ...(current || {}), [field]: value }));
    setMessage('');
    setError('');
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!progress?.progressStatus) {
      setError('Select your current WorkOne status.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/workone/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          token,
          progressStatus: progress.progressStatus,
          appointmentDate: progress.appointmentDate || null,
          workoneCenter: progress.workoneCenter || null,
          caseManagerName: progress.caseManagerName || null,
          caseManagerEmail: progress.caseManagerEmail || null,
          approvalReference: progress.approvalReference || null,
          feedback: progress.feedback || null,
          wantsCallback: Boolean(progress.wantsCallback),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Your update could not be saved.');
      setMessage(data.message || 'Your progress was updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Your update could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 focus:border-brand-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClass = 'mb-1 block text-sm font-bold text-slate-950';

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-slate-700" />
        <p className="mt-3 text-slate-700">Loading your WorkOne progress…</p>
      </div>
    );
  }

  if (error && !progress) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-900">
        <h2 className="font-black">We could not open this progress link.</h2>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  if (!progress) return null;

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your selected program</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">{progress.programName || 'Elevate training program'}</h2>
        {progress.referenceNumber && <p className="mt-1 text-sm text-slate-600">Application reference: <span className="font-mono font-bold">{progress.referenceNumber}</span></p>}
      </div>

      <div className={`rounded-xl border-2 p-5 ${progress.programCode ? 'border-slate-900 bg-slate-50' : 'border-amber-400 bg-amber-50'}`}>
        <p className="text-sm font-bold text-slate-700">INTraining Program ID to give WorkOne</p>
        <p className="mt-2 break-words font-mono text-3xl font-black text-slate-950">
          {progress.programCode || 'VERIFY WITH ELEVATE'}
        </p>
        <p className="mt-3 text-sm text-slate-700">
          If WorkOne cannot find Elevate by provider name, ask them to search this exact INTraining program ID. Bring the WorkOne Program Sheet that was emailed to you.
        </p>
      </div>

      <div>
        <label className={labelClass}>Where are you in the WorkOne process? *</label>
        <select
          className={fieldClass}
          value={progress.progressStatus || 'not_started'}
          onChange={(event) => setField('progressStatus', event.target.value)}
          required
        >
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>WorkOne appointment date</label>
          <input type="date" className={fieldClass} value={progress.appointmentDate || ''} onChange={(event) => setField('appointmentDate', event.target.value)} />
        </div>
        <div>
          <label className={labelClass}>WorkOne center / region</label>
          <input className={fieldClass} value={progress.workoneCenter || ''} onChange={(event) => setField('workoneCenter', event.target.value)} placeholder="Example: WorkOne Indy" />
        </div>
        <div>
          <label className={labelClass}>WorkOne case manager name</label>
          <input className={fieldClass} value={progress.caseManagerName || ''} onChange={(event) => setField('caseManagerName', event.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Case manager email</label>
          <input type="email" className={fieldClass} value={progress.caseManagerEmail || ''} onChange={(event) => setField('caseManagerEmail', event.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Funding approval / ITA / referral number</label>
        <input className={fieldClass} value={progress.approvalReference || ''} onChange={(event) => setField('approvalReference', event.target.value)} placeholder="Enter it when WorkOne gives you one" />
      </div>

      <div>
        <label className={labelClass}>What did WorkOne tell you? / What changed?</label>
        <textarea className={`${fieldClass} min-h-28`} value={progress.feedback || ''} onChange={(event) => setField('feedback', event.target.value)} placeholder="Tell Elevate what happened, what WorkOne needs, or what you are waiting on." />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
        <input type="checkbox" className="mt-1 h-5 w-5" checked={Boolean(progress.wantsCallback)} onChange={(event) => setField('wantsCallback', event.target.checked)} />
        <span>I need Elevate to contact me about my WorkOne funding progress.</span>
      </label>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-900">{error}</div>}
      {message && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <button type="submit" disabled={saving} className="w-full rounded-lg bg-slate-950 px-5 py-3.5 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? 'Saving and sending follow-up…' : 'Update My WorkOne Progress'}
      </button>

      <p className="text-xs leading-5 text-slate-500">
        Every saved update is sent to Elevate and recorded in your funding progress history. A follow-up email is generated for you based on the status you select.
      </p>
    </form>
  );
}
