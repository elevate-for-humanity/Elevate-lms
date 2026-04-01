'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  slug: string;
  programTitle: string;
  applyHref: string;
}

export default function RequestInfoForm({ slug, programTitle, applyHref }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value.trim(),
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value.trim(),
      email: (form.elements.namedItem('email') as HTMLInputElement).value.trim(),
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value.trim(),
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim(),
      fundingQuestion: (form.elements.namedItem('fundingQuestion') as HTMLSelectElement).value,
      source: 'program-request-info',
    };

    try {
      const res = await fetch(`/api/programs/${slug}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Submission failed');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-brand-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">We&apos;ll be in touch</h2>
        <p className="text-slate-600 mb-6">
          Your inquiry about <strong>{programTitle}</strong> has been received. An advisor will contact you within 1 business day.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={applyHref}
            className="inline-flex items-center justify-center gap-2 bg-brand-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-blue-700 transition"
          >
            Apply Now
          </a>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition"
          >
            Back to Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 mb-1">
            First Name <span className="text-brand-red-600">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="Jane"
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 mb-1">
            Last Name <span className="text-brand-red-600">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            placeholder="Smith"
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
          Email Address <span className="text-brand-red-600">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="jane@example.com"
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">
          Phone Number <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="(317) 555-0100"
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="fundingQuestion" className="block text-sm font-semibold text-slate-700 mb-1">
          How are you planning to pay? <span className="text-brand-red-600">*</span>
        </label>
        <select
          id="fundingQuestion"
          name="fundingQuestion"
          required
          defaultValue=""
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
        >
          <option value="" disabled>Select an option</option>
          <option value="wioa">WIOA / WorkOne funding</option>
          <option value="jri">Job Ready Indy / Reentry funding</option>
          <option value="workforce-ready-grant">Workforce Ready Grant</option>
          <option value="employer-sponsored">Employer sponsored</option>
          <option value="self-pay">Self-pay (out of pocket)</option>
          <option value="payment-plan">Self-pay with payment plan</option>
          <option value="not-sure">Not sure — need guidance</option>
        </select>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-1">
          Questions or comments <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder={`What would you like to know about the ${programTitle} program?`}
          className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {status === 'error' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errorMsg}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full bg-brand-blue-600 text-white py-3 rounded-xl font-bold text-base hover:bg-brand-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === 'submitting' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
        ) : (
          'Send My Request'
        )}
      </button>

      <p className="text-xs text-slate-500 text-center">
        An advisor will respond within 1 business day. No spam, ever.
      </p>
    </form>
  );
}
