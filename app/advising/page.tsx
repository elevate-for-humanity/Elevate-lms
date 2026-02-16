'use client';

import React from 'react';
// app/advising/page.tsx

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function AdvisingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      programInterest: formData.get('programInterest'),
      contactMethod: formData.getAll('contactMethod'),
      questions: formData.get('questions'),
    };

    try {
      // Send to your backend API or email service
      const response = await fetch('/api/advising-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert(
          'There was an error submitting your request. Please contact us at support center.'
        );
      }
    } catch (error) { /* Error handled silently */ 
      alert(
        'There was an error submitting your request. Please contact us at support center.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Advising' }]} />
        </div>
      </div>

      <div className="py-12 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Student Advising
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Talk with an advisor about your next steps.
          </h1>
          <p className="mt-3 text-sm text-black">
            Not sure where to start, what you qualify for, or which program fits
            you best? Our advising team will walk through your goals, barriers,
            and options so you don&apos;t have to figure it out alone.
          </p>
          <p className="mt-4 text-sm text-black">
            <strong>Prefer to call?</strong> Reach us at{' '}
            <a
              href="/support"
              className="text-indigo-600 font-semibold hover:underline"
            >
              support center
            </a>
          </p>
        </header>

        {isSubmitted ? (
          <section className="rounded-2xl bg-green-50 p-8 shadow-sm ring-1 ring-green-200 text-center">
            <div className="w-16 h-16 bg-brand-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-slate-400 flex-shrink-0">•</span>
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Request Submitted!
            </h2>
            <p className="text-black mb-4">
              Thank you for your interest. An advisor will contact you within
              1-2 business days.
            </p>
            <p className="text-sm text-black">
              Need immediate assistance? Contact us at{' '}
              <a
                href="/support"
                className="text-indigo-600 font-semibold hover:underline"
              >
                support center
              </a>
            </p>
          </section>
        ) : (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-sm font-semibold text-black">
              Schedule a meeting or visit
            </h2>
            <p className="mt-2 text-xs text-black">
              Complete this form and a member of our team will reach out to you
              within a reasonable timeframe to schedule a phone call, video
              meeting, or in-person appointment where available.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-5 text-sm text-black"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-semibold text-black"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold text-black"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-black"
                >
                  Email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label
                  htmlFor="programInterest"
                  className="block text-xs font-semibold text-black"
                >
                  Program or pathway you&apos;re interested in
                </label>
                <select
                  id="programInterest"
                  name="programInterest"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select an option (or leave blank)
                  </option>
                  <option value="barber-apprenticeship">
                    Barber Apprenticeship
                  </option>
                  <option value="beauty">Beauty / Nails / Esthetics</option>
                  <option value="healthcare">Healthcare (CNA, etc.)</option>
                  <option value="trades">
                    Skilled Trades / Building Maintenance
                  </option>
                  <option value="cdl">Transportation / CDL</option>
                  <option value="unsure">I&apos;m not sure yet</option>
                </select>
              </div>

              <div>
                <span className="block text-xs font-semibold text-black">
                  How would you like us to contact you?
                </span>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-black">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="contactMethod"
                      value="call"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Phone Call
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="contactMethod"
                      value="text"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Text Message
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="contactMethod"
                      value="email"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Email
                  </label>
                </div>
              </div>

              <div>
                <label
                  htmlFor="questions"
                  className="block text-xs font-semibold text-black"
                >
                  What would you like to talk about?
                </label>
                <p className="mt-1 text-[0.7rem] text-slate-500">
                  (Optional) Share any questions, concerns, or barriers you want
                  help with—like funding, childcare, transportation, re-enstart,
                  housing, or mental health.
                </p>
                <textarea
                  id="questions"
                  name="questions"
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <p className="text-[0.7rem] text-slate-500">
                By submitting this form, you are giving Elevate for Humanity
                permission to contact you about advising, programs, and support
                services. We do not share your information without your consent
                except as required by law.
              </p>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Advising Request'}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
