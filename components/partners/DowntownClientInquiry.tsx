'use client';

import { useState, type FormEvent } from 'react';

export default function DowntownClientInquiry() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'received' | 'error'>('idle');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;
    const data = new FormData(event.currentTarget);
    setStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'), email: data.get('email'), phone: data.get('phone'),
          role: 'beauty-service-client', interest: 'mesmerized-downtown-client',
          service: data.get('service'), message: data.get('message'),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Inquiry not received');
      setStatus('received');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'received') return (
    <div role="status" className="rounded-2xl border border-blue-200 bg-white p-6">
      <h3 className="text-xl font-bold">Your downtown service inquiry was received.</h3>
      <p className="mt-3 leading-7">The Elevate team has your request for Mesmerized by Beauty. Opening dates, services, prices, and appointments still need confirmation. This is not an appointment booking.</p>
    </div>
  );

  const inputStyle = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950';
  return (
    <form action="/api/contact" method="post" onSubmit={submit} className="space-y-5 rounded-2xl border border-blue-100 bg-white p-6 sm:p-8">
      <input type="hidden" name="role" value="beauty-service-client" />
      <input type="hidden" name="interest" value="mesmerized-downtown-client" />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-semibold">Your name<input className={inputStyle} name="name" autoComplete="name" required minLength={2} maxLength={120} /></label>
        <label className="font-semibold">Email<input className={inputStyle} name="email" type="email" autoComplete="email" required maxLength={200} /></label>
        <label className="font-semibold">Phone (optional)<input className={inputStyle} name="phone" type="tel" autoComplete="tel" maxLength={50} /></label>
        <label className="font-semibold">What interests you?
          <select className={inputStyle} name="service" required defaultValue="">
            <option value="" disabled>Choose an interest</option>
            <option>Nail services</option><option>Esthetic services</option><option>Opening information</option>
          </select>
        </label>
      </div>
      <label className="block font-semibold">Tell us what you’re looking for<textarea className={inputStyle} name="message" rows={3} required minLength={10} maxLength={3500} /></label>
      <p className="text-sm leading-6 text-slate-600">By sending this inquiry, you ask Elevate for Humanity to contact you about Mesmerized by Beauty’s downtown location. This does not enroll you in training, book an appointment, or subscribe you to marketing.</p>
      {status === 'error' && <p role="alert" className="text-red-800">Your inquiry could not be received. Your details are still here; please try again or use the phone or email below.</p>}
      <button disabled={status === 'sending'} type="submit" className="min-h-12 rounded-xl bg-blue-800 px-6 py-3 font-bold text-white disabled:opacity-60">
        {status === 'sending' ? 'Sending…' : 'Ask about downtown beauty services'}
      </button>
    </form>
  );
}
