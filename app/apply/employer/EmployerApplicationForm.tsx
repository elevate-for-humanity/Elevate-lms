'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitEmployerApplication } from '../actions';

export default function EmployerApplicationForm() {
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
      companyName: formData.get('companyName') as string,
      industry: formData.get('industry') as string,
      companySize: formData.get('companySize') as string,
      website: formData.get('website') as string,
      hiringNeeds: formData.get('hiringNeeds') as string,
      positionsAvailable: formData.get('positionsAvailable') as string,
      role: 'employer' as const,
    };

    const result = await submitEmployerApplication(data);

    if (result.success) {
      router.push(result.redirectTo!);
    } else {
      const subject = encodeURIComponent(`Employer Application: ${data.firstName} ${data.lastName} - ${data.companyName}`);
      const body = encodeURIComponent(
        `Name: ${data.firstName} ${data.lastName}\nCompany: ${data.companyName}\n` +
        `Email: ${data.email}\nPhone: ${data.phone}\n` +
        `Industry: ${data.industry || 'N/A'}\nHiring Needs: ${data.hiringNeeds || 'N/A'}\n`
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

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Company Information
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-black mb-2"
            >
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-black mb-2"
              >
                Industry *
              </label>
              <select
                id="industry"
                name="industry"
                required
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
              >
                <option value="">Select industry</option>
                <option value="healthcare">Healthcare</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="construction">Construction</option>
                <option value="technology">Technology</option>
                <option value="hospitality">Hospitality</option>
                <option value="retail">Retail</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="companySize"
                className="block text-sm font-medium text-black mb-2"
              >
                Company Size *
              </label>
              <select
                id="companySize"
                name="companySize"
                required
                className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
              >
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="website"
              className="block text-sm font-medium text-black mb-2"
            >
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              placeholder="https://"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Contact Information
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">Hiring Needs</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="hiringNeeds"
              className="block text-sm font-medium text-black mb-2"
            >
              What are your hiring needs?
            </label>
            <textarea
              id="hiringNeeds"
              name="hiringNeeds"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
              placeholder="Tell us about the positions you're looking to fill..."
            />
          </div>

          <div>
            <label
              htmlFor="positionsAvailable"
              className="block text-sm font-medium text-black mb-2"
            >
              Number of Positions Available
            </label>
            <input
              type="text"
              id="positionsAvailable"
              name="positionsAvailable"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
              placeholder="e.g., 5-10 positions"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
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
