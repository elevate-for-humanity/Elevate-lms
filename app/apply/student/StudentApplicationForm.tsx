'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { submitStudentApplication } from '../actions';
import { getActiveProgramsByCategory } from '@/lib/program-registry';
import { trackEvent } from '@/components/analytics/google-analytics';

const programGroups = getActiveProgramsByCategory();

// Programs that have a waitlist — show waitlist link instead of enrollment form
const WAITLIST_PROGRAMS = new Set(['cdl-training', 'barber-apprenticeship']);

export default function StudentApplicationForm({ initialProgram = '' }: { initialProgram?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicationType, setApplicationType] = useState<'inquiry' | 'enrollment' | ''>('');
  const [selectedProgram, setSelectedProgram] = useState(initialProgram);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Honeypot — hidden field bots fill in; silently redirect home
    if (formData.get('website_url')) {
      router.push('/');
      return;
    }

    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      password,
      dateOfBirth: formData.get('dateOfBirth') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      programInterest: formData.get('programInterest') as string,
      employmentStatus: formData.get('employmentStatus') as string,
      educationLevel: formData.get('educationLevel') as string,
      goals: formData.get('goals') as string,
      applicationType: applicationType as string,
      role: 'student' as const,
    };

    try {
      trackEvent('form_submit', applicationType === 'inquiry' ? 'inquiry' : 'application', data.programInterest);
      const result = await submitStudentApplication(data);

      if (result.success) {
        trackEvent('application_complete', 'conversion', data.programInterest);

        // Inquiry path or email-only fallback — thank you page, no payment
        if (applicationType === 'inquiry' || result.status === 'email_only') {
          router.push('/apply/inquiry-received');
          return;
        }

        // Enrollment path — application is submitted and pending review.
        // Redirect to checkout so the applicant can complete payment.
        // Enrollment is not granted until payment is verified and admin approves.
        router.push(`/enroll/checkout?program=${encodeURIComponent(data.programInterest)}&application_id=${result.applicationId}`);
        return;
      } else {
        setError(
          ('error' in result ? result.error : undefined) ||
          'Something went wrong submitting your application. Please try again or contact us at info@elevateforhumanity.org.'
        );
        setLoading(false);
      }
    } catch {
      setError(
        'The application system is temporarily unavailable. Please email us at info@elevateforhumanity.org with your name, phone, and program interest.'
      );
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot — invisible to real users, bots fill it in */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <label htmlFor="website_url">Website</label>
        <input type="text" id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Step 1 — Application type */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-1">What would you like to do?</h2>
        <p className="text-sm text-black mb-4">Select an option to get started.</p>
        <select
          required
          value={applicationType}
          onChange={e => setApplicationType(e.target.value as 'inquiry' | 'enrollment')}
          className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent bg-white text-sm"
        >
          <option value="">— Select an option —</option>
          <option value="inquiry">I want to learn more / request information (Inquiry)</option>
          <option value="enrollment">I am ready to enroll in a program (Enrollment)</option>
        </select>

        {/* Inquiry info box */}
        {applicationType === 'inquiry' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 leading-relaxed">
              <strong>Inquiry:</strong> We'll create your account and an advisor will follow up
              with program details, costs, and next steps. No payment is required at this stage.
            </p>
          </div>
        )}

        {/* Enrollment info + waitlist check */}
        {applicationType === 'enrollment' && selectedProgram && WAITLIST_PROGRAMS.has(selectedProgram) && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">This program currently has a waitlist.</p>
            <p className="text-sm text-amber-700 leading-relaxed mb-3">
              New enrollment spots are limited. Join the waitlist and we'll contact you
              as soon as a seat opens.
            </p>
            <Link
              href={`/apply/waitlist/${selectedProgram}`}
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              Join the Waitlist →
            </Link>
          </div>
        )}

        {/* Enrollment funding disclosure */}
        {applicationType === 'enrollment' && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Important — Enrollment requires payment or verified funding
            </p>
            <p className="text-sm text-amber-700 leading-relaxed">
              Enrollment is not finalized until payment is received or funding is verified.
              If you plan to use <strong>WIOA, WorkOne, EmployIndy, Workforce Ready Grant,
              or any state or federal funding</strong>, you must have written approval from
              your funding agency before enrollment can be completed.{' '}
              <a href="https://www.workone.in.gov" target="_blank" rel="noopener noreferrer"
                 className="underline font-semibold">Find your WorkOne office →</a>
            </p>
          </div>
        )}
      </div>

      {/* Only show the rest of the form once a type is selected */}
      {!applicationType && (
        <div className="text-center py-8 text-black text-sm">
          Select an option above to continue.
        </div>
      )}

      {/* Personal Information — shown for both paths */}
      {applicationType && (<>
      {/* Personal Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-black mb-2"
            >
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-black mb-2"
            >
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-black mb-2"
            >
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-2"
            >
              Create Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-black mb-2"
            >
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={8}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-black mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Address</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-black mb-2"
            >
              Street Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-black mb-2"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-black mb-2"
              >
                State
              </label>
              <select
                id="state"
                name="state"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                <option value="IN">Indiana</option>
                <option value="IL">Illinois</option>
                <option value="OH">Ohio</option>
                <option value="KY">Kentucky</option>
                <option value="MI">Michigan</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-black mb-2"
              >
                ZIP Code
              </label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Program Interest */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Program Interest
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="programInterest"
              className="block text-sm font-medium text-black mb-2"
            >
              Which program interests you?
            </label>
            <select
              id="programInterest"
              name="programInterest"
              value={selectedProgram}
              onChange={e => setSelectedProgram(e.target.value)}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select a program</option>
              {programGroups.map((group) => (
                <optgroup key={group.category} label={group.category}>
                  {group.programs.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
              <option value="not-sure">Not Sure Yet</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="employmentStatus"
              className="block text-sm font-medium text-black mb-2"
            >
              Current Employment Status
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select status</option>
              <option value="unemployed">Unemployed</option>
              <option value="part-time">Part-time Employed</option>
              <option value="full-time">Full-time Employed</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="educationLevel"
              className="block text-sm font-medium text-black mb-2"
            >
              Highest Education Level
            </label>
            <select
              id="educationLevel"
              name="educationLevel"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select level</option>
              <option value="no-hs">No High School Diploma</option>
              <option value="ged">GED</option>
              <option value="hs-diploma">High School Diploma</option>
              <option value="some-college">Some College</option>
              <option value="associates">Associate's Degree</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="graduate">Graduate Degree</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="goals"
              className="block text-sm font-medium text-black mb-2"
            >
              What are your career goals?
            </label>
            <textarea
              id="goals"
              name="goals"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Tell us about your career aspirations..."
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading || !applicationType}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-red-600 text-white font-bold rounded-lg hover:bg-brand-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? 'Submitting...'
            : applicationType === 'inquiry'
              ? 'Submit Inquiry'
              : 'Continue to Enrollment →'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
        >
          Back
        </button>
      </div>
      </>)}
    </form>
  );
}
