'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProgramHolderNotificationPreferences({ initial, phone }: { initial: any; phone: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(formData: FormData) {
    setSaving(true);
    setMessage('');
    const response = await fetch('/api/program-holder/notification-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    const result = await response.json().catch(() => ({}));
    setSaving(false);
    setMessage(response.ok ? 'Enrollment alert preferences saved.' : result.error || 'Preferences could not be saved.');
    if (response.ok) router.refresh();
  }

  return (
    <form action={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">New enrollment alerts</p>
      <h2 className="mt-1 text-xl font-black text-slate-950">How should we notify you?</h2>
      <p className="mt-1 text-sm text-slate-700">Choose email, text, both, or neither when a student is enrolled into your program.</p>
      <div className="mt-4 grid gap-2">
        <label className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="email_alerts" value="true" type="checkbox" defaultChecked={Boolean(initial?.email_course_updates)} /> Email me about new enrollments</label>
        <label className="flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="sms_alerts" value="true" type="checkbox" defaultChecked={Boolean(initial?.sms_urgent)} /> Text me about new enrollments</label>
        <label className="text-sm font-bold text-slate-800">Mobile number<input name="sms_phone" type="tel" defaultValue={initial?.sms_phone || phone} placeholder="317-555-0123" className="mt-1 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 font-normal" /></label>
      </div>
      <button disabled={saving} className="mt-4 min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save alert preferences'}</button>
      {message && <p role="status" className="mt-3 text-sm font-bold text-slate-800">{message}</p>}
    </form>
  );
}
