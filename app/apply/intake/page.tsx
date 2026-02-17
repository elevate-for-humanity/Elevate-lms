'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function IntakePage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fundingTag, setFundingTag] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        setSubmitted(true);
        setFundingTag(result.funding_tag || '');
      } else {
        setError(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Application Received</h1>
          <p className="text-lg text-slate-600 mb-2">
            Thank you for your interest in Elevate for Humanity.
          </p>
          {fundingTag === 'jri' && (
            <p className="text-base text-slate-700 mb-6">
              Based on your responses, you may qualify for Justice Reinvestment Initiative (JRI) funding.
              Our team will review your eligibility and contact you within 2 business days.
            </p>
          )}
          {fundingTag === 'self-pay' && (
            <p className="text-base text-slate-700 mb-6">
              We&apos;ve noted your self-pay preference. Our enrollment team will contact you
              with program details and payment options within 2 business days.
            </p>
          )}
          {(fundingTag === 'wioa' || fundingTag === 'pending-review') && (
            <p className="text-base text-slate-700 mb-6">
              We will review your funding eligibility and contact you within 2 business days.
              You may qualify for WIOA, WRG, or other workforce funding.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link href="/programs" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-lg transition-colors text-center">
              Browse Programs
            </Link>
            <Link href="/" className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors text-center">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            Funding & Apprenticeship Intake
          </h1>
          <p className="text-slate-300 text-lg">
            This form screens your eligibility for workforce-funded training programs
            including WIOA, WRG, and JRI. Funding is not guaranteed and requires partner review.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          {error && (
            <div className="bg-brand-red-50 border border-brand-red-200 text-brand-red-800 px-4 py-3 rounded-lg mb-6" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input id="full_name" name="full_name" required className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input id="email" name="email" type="email" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                    <input id="phone" name="phone" type="tel" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-1">City</label>
                    <input id="city" name="city" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-slate-700 mb-1">State</label>
                    <input id="state" name="state" defaultValue="IN" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Program Interest */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Program Interest</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="program_interest" className="block text-sm font-semibold text-slate-700 mb-1">Which program are you interested in?</label>
                  <select id="program_interest" name="program_interest" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="barbering">Barber Apprenticeship</option>
                    <option value="cna">CNA Certification</option>
                    <option value="cdl">CDL Training</option>
                    <option value="medical-assistant">Medical Assistant</option>
                    <option value="phlebotomy">Phlebotomy</option>
                    <option value="hvac">HVAC Technician</option>
                    <option value="welding">Welding</option>
                    <option value="electrical">Electrical</option>
                    <option value="technology">Technology / IT</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="preferred_location" className="block text-sm font-semibold text-slate-700 mb-1">Preferred Training Location</label>
                  <input id="preferred_location" name="preferred_location" placeholder="e.g. Indianapolis, Kokomo" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                </div>
              </div>
            </div>

            {/* Funding Eligibility */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Funding Eligibility</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="employment_status" className="block text-sm font-semibold text-slate-700 mb-1">Current Employment Status</label>
                  <select id="employment_status" name="employment_status" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="">Select...</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="part-time">Part-Time</option>
                    <option value="full-time">Full-Time</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="funding_needed" className="block text-sm font-semibold text-slate-700 mb-1">Do you need funding assistance?</label>
                  <select id="funding_needed" name="funding_needed" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="true">Yes, I need funding assistance</option>
                    <option value="false">No, I can self-pay</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="probation_or_reentry" className="block text-sm font-semibold text-slate-700 mb-1">Are you connected to probation, reentry, or community corrections?</label>
                  <select id="probation_or_reentry" name="probation_or_reentry" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="workforce_connection" className="block text-sm font-semibold text-slate-700 mb-1">Are you connected to any workforce services?</label>
                  <select id="workforce_connection" name="workforce_connection" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="">None / Not sure</option>
                    <option value="workone">WorkOne Indiana</option>
                    <option value="employer-indy">Employer Indy</option>
                    <option value="goodwill">Goodwill</option>
                    <option value="reclaim-academy">Reclaim Academy</option>
                    <option value="other">Other workforce program</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="referral_source" className="block text-sm font-semibold text-slate-700 mb-1">How did you hear about us?</label>
                  <select id="referral_source" name="referral_source" className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500">
                    <option value="">Select...</option>
                    <option value="website">Website</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Friend / Family Referral</option>
                    <option value="workforce-partner">Workforce Partner</option>
                    <option value="probation-officer">Probation / Parole Officer</option>
                    <option value="community-event">Community Event</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-1">Tell us about your goals (optional)</label>
                  <textarea id="notes" name="notes" rows={4} className="w-full border border-slate-300 bg-white text-slate-900 p-3 rounded-lg focus:ring-2 focus:ring-brand-red-500 focus:border-brand-red-500" />
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
              By submitting this form, you authorize Elevate for Humanity, Inc. to review your
              eligibility for workforce-funded training programs. Funding eligibility is determined
              by our workforce partners and is not guaranteed. Your information will be kept
              confidential in accordance with our <Link href="/privacy-policy" className="text-brand-red-600 underline">privacy policy</Link>.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white text-lg font-bold p-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'Submitting...' : (
                <>Check Eligibility & Apply <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
