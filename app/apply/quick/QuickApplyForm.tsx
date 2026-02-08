'use client';
import Turnstile from '@/components/Turnstile';

import { useState } from 'react';


export default function QuickApplyForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/apply/simple', {
        method: 'POST',
        body: formData,
      });

      if (response.redirected) {
        window.location.href = response.url;
      } else if (response.ok) {
        window.location.href = '/apply/confirmation';
      } else {
        throw new Error('Application submission failed');
      }
    } catch (error) {
      alert('Failed to submit application. Please try again.');
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-6"
    >
      {/* Contact Information */}
      <div>
        <h2 className="text-xl font-bold text-black mb-4">
          Contact Information
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-black mb-2"
            >
              Full Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              aria-required="true"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Full name as it appears on your ID"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email Address <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              aria-required="true"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="your.email@gmail.com"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-black mb-2"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Contact Us"
            />
          </div>
        </div>
      </div>

      {/* Program Selection */}
      <div>
        <h2 className="text-xl font-bold text-black mb-4">
          Program Interest
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="program"
              className="block text-sm font-medium text-black mb-2"
            >
              Which program are you interested in?{' '}
              <span className="text-red-600">*</span>
            </label>
            <select
              id="program"
              name="program"
              required
              aria-required="true"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select a program...</option>
              <option value="CNA">Certified Nursing Assistant (CNA)</option>
              <option value="CDL">Commercial Driver's License (CDL)</option>
              <option value="Welding">Welding</option>
              <option value="HVAC">HVAC Technician</option>
              <option value="IT">Information Technology</option>
              <option value="Not Sure">Not Sure Yet</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="funding"
              className="block text-sm font-medium text-black mb-2"
            >
              How do you plan to fund your training?{' '}
              <span className="text-red-600">*</span>
            </label>
            <select
              id="funding"
              name="funding"
              required
              aria-required="true"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="">Select funding source...</option>
              <option value="WIOA">WIOA (Workforce Innovation)</option>
              <option value="TANF">TANF (Temporary Assistance)</option>
              <option value="SNAP">SNAP (Food Assistance)</option>
              <option value="Veteran Benefits">Veteran Benefits</option>
              <option value="Employer Sponsored">Employer Sponsored</option>
              <option value="Self Pay">Self Pay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Eligibility Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> If you select a specific program and a funding
          source other than Self Pay, we'll pre-screen your eligibility and
          prioritize your application.
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>

      {/* Privacy Notice */}
      <p className="text-xs text-black text-center">
        By submitting this form, you agree to our privacy policy and consent to
        be contacted about training programs.
      </p>
    </form>
  );
}
