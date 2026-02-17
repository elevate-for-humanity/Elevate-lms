'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitProgramHolderApplication } from '../actions';

export default function ProgramHolderForm() {
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
      organizationName: formData.get('organizationName') as string,
      organizationType: formData.get('organizationType') as string,
      website: formData.get('website') as string,
      numberOfStudents: formData.get('numberOfStudents') as string,
      programsOffered: formData.get('programsOffered') as string,
      partnershipGoals: formData.get('partnershipGoals') as string,
      role: 'program_holder' as const,
    };

    const result = await submitProgramHolderApplication(data);

    if (result.success) {
      router.push(result.redirectTo!);
    } else {
      const subject = encodeURIComponent(`Program Holder Application: ${data.firstName} ${data.lastName} - ${data.organizationName}`);
      const body = encodeURIComponent(
        `Name: ${data.firstName} ${data.lastName}\nOrganization: ${data.organizationName}\n` +
        `Email: ${data.email}\nPhone: ${data.phone}\n` +
        `Programs Offered: ${data.programsOffered || 'N/A'}\nGoals: ${data.partnershipGoals || 'N/A'}\n`
      );
      window.location.href = `mailto:info@elevateforhumanity.org?subject=${subject}&body=${body}`;
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Contact Information */}
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
        </div>
      </div>

      {/* Organization Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Organization Information
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="organizationName"
              className="block text-sm font-medium text-black mb-2"
            >
              Organization Name *
            </label>
            <input
              type="text"
              id="organizationName"
              name="organizationName"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="organizationType"
              className="block text-sm font-medium text-black mb-2"
            >
              Organization Type
            </label>
            <select
              id="organizationType"
              name="organizationType"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select type</option>
              <option value="school">School / Educational Institution</option>
              <option value="nonprofit">Nonprofit Organization</option>
              <option value="workforce-board">
                Workforce Development Board
              </option>
              <option value="community-org">Community Organization</option>
              <option value="government">Government Agency</option>
              <option value="other">Other</option>
            </select>
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
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="numberOfStudents"
              className="block text-sm font-medium text-black mb-2"
            >
              Estimated Number of Students
            </label>
            <select
              id="numberOfStudents"
              name="numberOfStudents"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select range</option>
              <option value="1-50">1-50 students</option>
              <option value="51-100">51-100 students</option>
              <option value="101-500">101-500 students</option>
              <option value="500+">500+ students</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="programsOffered"
              className="block text-sm font-medium text-black mb-2"
            >
              Programs Currently Offered
            </label>
            <textarea
              id="programsOffered"
              name="programsOffered"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="List the training programs you currently offer..."
            />
          </div>

          <div>
            <label
              htmlFor="partnershipGoals"
              className="block text-sm font-medium text-black mb-2"
            >
              Partnership Goals
            </label>
            <textarea
              id="partnershipGoals"
              name="partnershipGoals"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="What do you hope to achieve through this partnership?"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting...' : 'Submit Partnership Application'}
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
