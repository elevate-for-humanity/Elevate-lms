'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

const PROGRAMS = [
  ['barber', 'Barber Apprenticeship'],
  ['cosmetology', 'Cosmetology Apprenticeship'],
  ['esthetician', 'Esthetician Apprenticeship'],
  ['nail', 'Nail Technician Apprenticeship'],
] as const;

export default function HostShopApplyPage() {
  const [programs, setPrograms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicationId, setApplicationId] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/host-shop/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.get('businessName'),
          contactName: form.get('contactName'),
          email: form.get('email'),
          phone: form.get('phone'),
          city: form.get('city'),
          state: form.get('state'),
          industryType: form.get('industryType'),
          licenseNumber: form.get('licenseNumber'),
          yearsInBusiness: form.get('yearsInBusiness'),
          numberOfChairs: form.get('numberOfChairs'),
          hasInsurance: form.get('hasInsurance'),
          howHeard: form.get('howHeard'),
          message: form.get('message'),
          programs,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Application could not be submitted.');
      }
      setApplicationId(result.applicationId || 'received');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationId) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-black text-slate-950">Host shop application received</h1>
          <p className="mt-4 text-base leading-7 text-slate-700">Your application is now in review. We will verify the business, licensing, supervision, and apprenticeship program fit before approval.</p>
          <p className="mt-4 rounded-xl bg-slate-100 px-4 py-3 font-mono text-xs text-slate-700">Reference: {applicationId}</p>
          <Link href="/host-shop" className="mt-7 inline-flex rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Return to Host Shop page</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/host-shop" className="inline-flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-brand-red-700"><ArrowLeft className="h-4 w-4" /> Host Shop overview</Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Employer Partnership</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Apply to become a Host Shop</h1>
          <p className="mt-4 text-base leading-7 text-slate-700">This is the employer/host-shop application. It is separate from the apprentice/student enrollment application.</p>

          <form onSubmit={submit} className="mt-8 space-y-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Business name" name="businessName" required />
              <Field label="Primary contact" name="contactName" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phone" type="tel" required />
              <Field label="City" name="city" required />
              <Field label="State" name="state" defaultValue="Indiana" required />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-900">Business type</span>
                <select name="industryType" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950">
                  <option value="barbershop">Barbershop</option>
                  <option value="salon">Salon / Beauty Shop</option>
                  <option value="esthetics_spa">Esthetics Spa</option>
                  <option value="nail_salon">Nail Salon</option>
                  <option value="mobile">Mobile / Booth Rental</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <Field label="Indiana shop/license number" name="licenseNumber" />
              <Field label="Years in business" name="yearsInBusiness" type="number" />
              <Field label="Chairs / workstations" name="numberOfChairs" type="number" />
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-900">Commercial liability insurance</span>
                <select name="hasInsurance" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950">
                  <option value="yes">Yes</option>
                  <option value="pending">In progress</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-900">How did you hear about Elevate?</span>
                <select name="howHeard" className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-950">
                  <option value="google">Google / Search</option>
                  <option value="referral">Referral</option>
                  <option value="social">Social Media</option>
                  <option value="workforce">WorkOne / Workforce</option>
                  <option value="community">Community Event</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>

            <fieldset>
              <legend className="text-sm font-bold text-slate-900">Programs you can host *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {PROGRAMS.map(([value, label]) => (
                  <label key={value} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      value={value}
                      checked={programs.includes(value)}
                      onChange={(event) => setPrograms((current) => event.target.checked ? [...current, value] : current.filter((item) => item !== value))}
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-900">Tell us about your shop and supervision capacity</span>
              <textarea name="message" rows={5} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950" />
            </label>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

            <button
              type="submit"
              disabled={submitting || programs.length === 0}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {submitting ? 'Submitting…' : 'Submit Host Shop Application'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, name, type = 'text', required = false, defaultValue }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">{label}{required ? ' *' : ''}</span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className="min-h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-950" />
    </label>
  );
}
