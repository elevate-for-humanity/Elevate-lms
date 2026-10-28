"use client";

import { useState } from 'react';

export const APPRENTICE_APPLICATION_URL = 'https://www.elevateforhumanity.org/apply/student/form';

export default function StudentOnboardingLinks({ shopName }: { shopName: string }) {
  const [message, setMessage] = useState('');
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(APPRENTICE_APPLICATION_URL);
      setMessage('Application link copied. Send it to your apprentice.');
    } catch {
      setMessage('Select and copy the application link below.');
    }
  }
  const emailBody = `Please complete your apprentice application: ${APPRENTICE_APPLICATION_URL}\n\nSelect your apprenticeship program and ${shopName || 'your host shop'} on the application. Elevate will review your application and confirm your placement and authorized start.`;
  return (
    <section className="my-6 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm" aria-labelledby="apprentice-onboarding-heading">
      <h2 id="apprentice-onboarding-heading" className="text-2xl font-black text-slate-950">Onboard an apprentice</h2>
      <p className="mt-2 text-slate-700">Staff can open the application here or forward this direct link to an apprentice. The apprentice completes their own information and acknowledgments.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={APPRENTICE_APPLICATION_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Onboard your students</a>
        <button type="button" onClick={copyLink} className="min-h-12 rounded-xl border border-slate-400 px-5 py-3 font-bold text-slate-950">Copy application link</button>
        <a href={`mailto:?subject=${encodeURIComponent('Your apprenticeship application')}&body=${encodeURIComponent(emailBody)}`} className="inline-flex min-h-12 items-center rounded-xl border border-slate-400 px-5 py-3 font-bold text-slate-950">Email application link</a>
      </div>
      <label className="mt-4 block text-sm font-bold text-slate-800">Direct apprentice application
        <input readOnly value={APPRENTICE_APPLICATION_URL} onFocus={(event) => event.currentTarget.select()} className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal" />
      </label>
      <p role="status" className="mt-2 text-sm text-slate-700">{message}</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
        <li>Send the link. The apprentice selects their program and Host Shop.</li>
        <li>The apprentice submits the application and completes account and enrollment requirements.</li>
        <li>Elevate reviews eligibility, confirms placement, and authorizes the training start. Applying does not automatically assign a student or authorize work hours.</li>
        <li>After placement is confirmed, use the Apprentices tab to review assigned students and track their training.</li>
      </ol>
    </section>
  );
}
