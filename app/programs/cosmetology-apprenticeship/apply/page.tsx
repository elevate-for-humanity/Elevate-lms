'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CosmetologyApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.currentTarget;
    const data = {
      firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
      lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      city: (form.elements.namedItem('city') as HTMLInputElement).value,
      programInterest: 'cosmetology-apprenticeship',
      source: 'student-application',
    };

    try {
      const res = await fetch('/api/apply/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Submission failed. Please try again.');
      }

      router.push('/programs/cosmetology-apprenticeship/apply/success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        <Link
          href="/programs/cosmetology-apprenticeship"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Program
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <span className="text-xs font-bold text-brand-green-600 uppercase tracking-wider">DOL Registered Apprenticeship</span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Cosmetology Apprenticeship Application</h1>
            <p className="text-slate-500 text-sm mt-2">
              Earn while you learn. Complete this form to begin your application — our team will contact you within 1 business day.
            </p>
          </div>

          {/* What to expect */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
            {[
              'Free to apply — no cost to submit',
              'Earn wages from day one of training',
              'Nationally recognized credential upon completion',
              'Flexible scheduling around your life',
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brand-green-500 flex-shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="phone">Phone Number *</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="city">City *</label>
              <input
                id="city"
                name="city"
                type="text"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                'Submit Application'
              )}
            </button>

            <p className="text-xs text-slate-400 text-center">
              Questions?{' '}
              <a href="tel:3173143757" className="text-brand-blue-600 hover:underline">(317) 314-3757</a>
              {' '}or{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-brand-blue-600 hover:underline">email us</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
