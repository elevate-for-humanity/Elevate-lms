'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitStaffApplication } from '../actions';

export default function StaffApplicationForm() {
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
      role: formData.get('role') as 'staff' | 'instructor',
      position: formData.get('position') as string,
      experience: formData.get('experience') as string,
      education: formData.get('education') as string,
      certifications: formData.get('certifications') as string,
      availability: formData.get('availability') as string,
      coverLetter: formData.get('coverLetter') as string,
    };

    const result = await submitStaffApplication(data);

    if (result.success) {
      router.push(result.redirectTo!);
    } else {
      const subject = encodeURIComponent(`Staff Application: ${data.firstName} ${data.lastName} - ${data.position}`);
      const body = encodeURIComponent(
        `Name: ${data.firstName} ${data.lastName}\nPosition: ${data.position}\n` +
        `Email: ${data.email}\nPhone: ${data.phone}\n` +
        `Experience: ${data.experience || 'N/A'}\nAvailability: ${data.availability || 'N/A'}\n`
      );
      window.location.href = `mailto:elevate4humanityedu@gmail.com?subject=${subject}&body=${body}`;
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
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-black mb-4">
          Position Details
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-black mb-2"
            >
              Role Type *
            </label>
            <select
              id="role"
              name="role"
              required
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select role</option>
              <option value="staff">Staff</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-black mb-2"
            >
              Position Applying For *
            </label>
            <input
              type="text"
              id="position"
              name="position"
              required
              placeholder="e.g., Program Coordinator, HVAC Instructor"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="experience"
              className="block text-sm font-medium text-black mb-2"
            >
              Relevant Experience
            </label>
            <textarea
              id="experience"
              name="experience"
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Describe your relevant work experience..."
            />
          </div>

          <div>
            <label
              htmlFor="education"
              className="block text-sm font-medium text-black mb-2"
            >
              Education
            </label>
            <textarea
              id="education"
              name="education"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="List your educational background..."
            />
          </div>

          <div>
            <label
              htmlFor="certifications"
              className="block text-sm font-medium text-black mb-2"
            >
              Certifications & Licenses
            </label>
            <textarea
              id="certifications"
              name="certifications"
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="List any relevant certifications or licenses..."
            />
          </div>

          <div>
            <label
              htmlFor="availability"
              className="block text-sm font-medium text-black mb-2"
            >
              Availability
            </label>
            <select
              id="availability"
              name="availability"
              className="w-full min-h-[44px] px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            >
              <option value="">Select availability</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="coverLetter"
              className="block text-sm font-medium text-black mb-2"
            >
              Cover Letter
            </label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              rows={6}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              placeholder="Tell us why you'd be a great fit for this role..."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 min-h-[48px] px-6 py-3 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
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
