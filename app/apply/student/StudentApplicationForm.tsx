'use client';
import Turnstile from '@/components/Turnstile';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitStudentApplication } from '../actions';
import { getActiveProgramsByCategory } from '@/lib/program-registry';

const programGroups = getActiveProgramsByCategory();

export default function StudentApplicationForm({ initialProgram = '' }: { initialProgram?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zipCode: formData.get('zipCode') as string,
      programInterest: formData.get('programInterest') as string,
      employmentStatus: formData.get('employmentStatus') as string,
      educationLevel: formData.get('educationLevel') as string,
      goals: formData.get('goals') as string,
      role: 'student' as const,
    };

    const result = await submitStudentApplication(data);

    if (result.success) {
      router.push(result.redirectTo!);
    } else {
      // Fallback: open pre-filled email if system is unavailable
      const subject = encodeURIComponent(`Student Application: ${data.firstName} ${data.lastName}`);
      const body = encodeURIComponent(
        `Name: ${data.firstName} ${data.lastName}\n` +
        `Email: ${data.email}\n` +
        `Phone: ${data.phone}\n` +
        `City: ${data.city || 'N/A'}, ${data.state || 'N/A'} ${data.zipCode || ''}\n` +
        `Program Interest: ${data.programInterest || 'Not specified'}\n` +
        `Employment: ${data.employmentStatus || 'N/A'}\n` +
        `Education: ${data.educationLevel || 'N/A'}\n` +
        `Goals: ${data.goals || 'N/A'}\n`
      );
      window.location.href = "/contact";
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              defaultValue={initialProgram}
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Tell us about your career aspirations..."
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="min-h-[48px] px-6 py-3 bg-white border-2 border-slate-300 text-black font-semibold rounded-lg hover:border-slate-400 transition-colors"
        >
          Back
        </button>
      </div>
    </form>
  );
}
