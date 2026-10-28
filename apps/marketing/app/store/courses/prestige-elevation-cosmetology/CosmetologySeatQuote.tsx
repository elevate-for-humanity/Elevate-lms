'use client';
import { useState } from 'react';
import { COSMETOLOGY_COURSE_LICENSE, cosmetologyLicenseTotal } from '@/lib/store/cosmetology-course-license';
export default function CosmetologySeatQuote() {
  const [seats, setSeats] = useState(1);
  const valid = Number.isSafeInteger(seats) && seats >= 1 && seats <= 1000;
  const total = valid ? cosmetologyLicenseTotal(seats) / 100 : null;
  const request = 'Hello Elevate, I would like an invoice for ' + seats +
    ' student seat(s) for the Prestige Elevation Cosmetology Course at $275 per student. Organization name: ';
  return <section aria-label="Organization seat pricing" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <p className="text-sm font-semibold uppercase tracking-widest text-teal-800">Organization license</p>
    <h2 className="mt-3 text-4xl font-bold">$275 <span className="text-base font-normal text-slate-600">per student</span></h2>
    <label htmlFor="student-seats" className="mt-6 block font-semibold">How many students?</label>
    <input id="student-seats" type="number" min={1} max={1000} step={1} value={seats || ''}
      onChange={(event) => setSeats(Number(event.target.value))}
      className="mt-2 min-h-12 w-full rounded-lg border border-slate-400 p-3" />
    <p aria-live="polite" className="my-5 text-xl font-semibold">{total === null ? 'Enter 1 to 1,000 students.' : total.toLocaleString('en-US', {style:'currency',currency:'USD'}) + ' course license total'}</p>
    {valid && <a className="block rounded-lg bg-teal-800 px-5 py-3 text-center font-semibold text-white"
      href={'mailto:info@elevateforhumanity.org?subject=' + encodeURIComponent(COSMETOLOGY_COURSE_LICENSE.name + ' organization license') + '&body=' + encodeURIComponent(request)}>
      Request cohort invoice</a>}
    <p className="mt-4 text-sm leading-relaxed text-slate-600">Send your organization name and student count. Elevate confirms the learner roster and invoice before paid seats are activated.</p>
  </section>;
}
