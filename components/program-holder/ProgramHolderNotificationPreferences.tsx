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
    setMessage(response.ok ? 'Notification choices saved.' : result.error || 'Preferences could not be saved.');
    if (response.ok) router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">Meet Paris</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">Your program communication assistant</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Paris can prepare enrollment messages, send approved email or text outreach, schedule follow-ups,
          and show the provider status for each email.
        </p>
        <ol className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <li className="rounded-xl bg-white p-4"><strong>1. Review</strong><br />Confirm the recipient, channel, subject, and message.</li>
          <li className="rounded-xl bg-white p-4"><strong>2. Send</strong><br />Paris confirms when the provider accepts the request.</li>
          <li className="rounded-xl bg-white p-4"><strong>3. Track</strong><br />See delivered, open detected, clicked, bounced, or failed.</li>
        </ol>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          “Open detected” is not a guaranteed read receipt. Privacy protection and blocked images can hide or pre-load opens.
        </p>
      </section>

      <form action={submit} className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Alerts</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">How should we notify you?</h2>
        <p className="mt-1 text-sm text-slate-700">Choose email, text, both, or neither for enrollments and Paris delivery updates.</p>
        <div className="mt-4 grid gap-2">
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="email_alerts" value="true" type="checkbox" defaultChecked={Boolean(initial?.email_course_updates)} className="h-8 w-8 shrink-0 accent-blue-700" /> Email me about new enrollments</label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="sms_alerts" value="true" type="checkbox" defaultChecked={Boolean(initial?.sms_urgent)} className="h-8 w-8 shrink-0 accent-blue-700" /> Text me about new enrollments</label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="email_delivery_updates" value="true" type="checkbox" defaultChecked={initial?.email_delivery_updates !== false} className="h-8 w-8 shrink-0 accent-blue-700" /> Email me when Paris messages are delivered, bounced, or fail</label>
          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 text-sm font-bold"><input name="sms_delivery_updates" value="true" type="checkbox" defaultChecked={Boolean(initial?.sms_delivery_updates)} className="h-8 w-8 shrink-0 accent-blue-700" /> Text me when Paris messages bounce or fail</label>
          <label className="text-sm font-bold text-slate-800">Mobile number<input name="sms_phone" type="tel" defaultValue={initial?.sms_phone || phone} placeholder="317-555-0123" className="mt-1 min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 font-normal" /></label>
        </div>
        <button disabled={saving} className="mt-4 min-h-11 rounded-xl bg-blue-700 px-5 text-sm font-black text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save notification choices'}</button>
        {message && <p role="status" className="mt-3 text-sm font-bold text-slate-800">{message}</p>}
      </form>
    </div>
  );
}
