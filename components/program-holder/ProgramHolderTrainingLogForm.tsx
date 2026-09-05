'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const milestones = [
  'Orientation and workplace safety',
  'Tools, equipment, and system fundamentals',
  'Installation and preventive maintenance',
  'Diagnostics and troubleshooting',
  'Refrigerant handling and environmental rules',
  'Employer engagement and job readiness',
] as const;

export function ProgramHolderTrainingLogForm({ enrollments }: { enrollments: any[]; programs: any[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(formData: FormData) {
    setSaving(true); setMessage('');
    const response = await fetch('/api/program-holder/training-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) return setMessage(result.error || 'Progress could not be saved.');
    setMessage('48-hour milestone and WorkOne progress saved for Admin review.');
    (document.getElementById('program-holder-training-log') as HTMLFormElement | null)?.reset();
    router.refresh();
  }
  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-black text-slate-950">48-hour WorkOne progress record</h2>
      <p className="mt-1 text-sm text-slate-700">Complete this for each current or graduated student. Record the milestone, hours, work performed, and skills learned.</p>
      <form id="program-holder-training-log" action={submit} className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-bold">Student<select name="enrollment_id" required className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"><option value="">Select student</option>{enrollments.map((row) => <option key={row.id} value={row.id}>{row.full_name || row.email || 'Student'} — {Number(row.total_hours_completed || 0)} of 48 hours</option>)}</select></label>
        <label className="text-sm font-bold">Milestone<select name="milestone" required className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal"><option value="">Select milestone</option>{milestones.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-bold">Training date<input name="work_date" type="date" required className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal" /></label>
        <label className="text-sm font-bold">Hours for this entry<input name="hours" type="number" min="0.25" max="48" step="0.25" required className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal" /></label>
        <label className="text-sm font-bold md:col-span-2">Work performed<textarea name="work_completed" minLength={10} maxLength={1500} required rows={3} placeholder="Describe the hands-on work, equipment, and results." className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal" /></label>
        <label className="text-sm font-bold md:col-span-2">Skills and knowledge learned<textarea name="skills_learned" minLength={10} maxLength={1500} required rows={3} placeholder="Describe what the student learned and can now demonstrate." className="mt-1 w-full rounded-lg border bg-white px-3 py-2 font-normal" /></label>
        <label className="text-sm font-bold">Overall progress after this entry (%)<input name="progress_percent" type="number" min="0" max="100" step="1" required className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3 font-normal" /></label>
        <label className="flex items-center gap-3 rounded-lg border bg-white p-3 text-sm font-bold"><input name="attested" value="true" type="checkbox" required /> I certify this record is accurate.</label>
        <div className="md:col-span-2"><button disabled={saving || !enrollments.length} className="min-h-11 rounded-lg bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save student milestone'}</button>{message && <p role="status" className="mt-3 text-sm font-bold">{message}</p>}</div>
      </form>
    </section>
  );
}
