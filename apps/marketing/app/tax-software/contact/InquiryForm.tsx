'use client';
import { useState, type FormEvent } from 'react';
export function InquiryForm() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reference, setReference] = useState('');
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/tax/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.get('name'),
          email: d.get('email'),
          phone: d.get('phone'),
          service: d.get('service'),
          taxYear: Number(d.get('taxYear')),
          message: d.get('message'),
        }),
      });
      const result = await r.json();
      if (!r.ok || !result.ok)
        throw Error(result.error || 'Your request could not be saved. Please retry.');
      setReference(result.reference);
      form.reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Your request could not be saved. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  const field =
    'mt-2 block min-h-12 w-full rounded-lg border border-slate-400 bg-white p-3 text-base text-slate-950';
  return (
    <section id="request-help" className="scroll-mt-6 px-6 py-12 sm:px-10 lg:px-14">
      <h2 className="text-3xl font-bold text-slate-950">Request help from a Supersonic preparer</h2>
      <p className="mt-4 max-w-2xl leading-7 text-slate-700">
        Tell us how to reach you and what help you need. Do not include Social Security numbers,
        banking details or tax documents.
      </p>
      {reference ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-300 bg-green-50 p-6 text-green-950"
        >
          <h3 className="text-xl font-bold">Your request is saved</h3>
          <p className="mt-3">
            Our Supersonic office can now review your inquiry. This does not book an appointment or
            file a return.
          </p>
          <p className="mt-3 break-all text-sm">Reference: {reference}</p>
          <button
            type="button"
            className="mt-4 min-h-12 font-bold underline"
            onClick={() => setReference('')}
          >
            Send another inquiry
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-6 grid gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2"
        >
          <label className="font-semibold text-slate-950">
            Full name
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              className={field}
            />
          </label>
          <label className="font-semibold text-slate-950">
            Email
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className={field}
            />
          </label>
          <label className="font-semibold text-slate-950">
            Phone (optional)
            <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={field} />
          </label>
          <label className="font-semibold text-slate-950">
            Tax year
            <select name="taxYear" defaultValue={new Date().getFullYear() - 1} className={field}>
              {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="font-semibold text-slate-950 sm:col-span-2">
            What help do you need?
            <select name="service" className={field}>
              <option value="personal">Personal tax preparation</option>
              <option value="self-employed">Self-employed tax preparation</option>
              <option value="business">Business tax preparation</option>
              <option value="amended">Amended return</option>
              <option value="review">Review my prepared return</option>
              <option value="free-preparation">Free professional preparation eligibility</option>
            </select>
          </label>
          <label className="font-semibold text-slate-950 sm:col-span-2">
            Brief description
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={1500}
              rows={4}
              className={field}
            />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-900 sm:col-span-2">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="min-h-12 rounded-xl bg-[#073ca2] px-6 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2"
          >
            {busy ? 'Saving your request…' : 'Send request to Supersonic'}
          </button>
        </form>
      )}
    </section>
  );
}
