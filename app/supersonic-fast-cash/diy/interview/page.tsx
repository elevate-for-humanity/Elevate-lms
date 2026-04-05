'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function DIYInterviewPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const body = Object.fromEntries(data.entries());

      const res = await fetch('/api/supersonic/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/supersonic-fast-cash/diy/review');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Supersonic Fast Cash', href: '/supersonic-fast-cash' },
            { label: 'Interview' },
          ]}
        />
      </div>
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold mb-6">DIY Tax Interview</h1>
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tax Filing Interview</h2>
              <span className="text-sm text-black">Step 1 of 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div className="bg-brand-orange-600 h-2 rounded-full" style={{ width: '20%' }} />
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Social Security Number *</label>
                  <input
                    type="text"
                    name="ssn"
                    placeholder="XXX-XX-XXXX"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    name="dob"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Filing Status</h3>
              <div className="space-y-2">
                {[
                  { value: 'single', label: 'Single' },
                  { value: 'married_joint', label: 'Married Filing Jointly' },
                  { value: 'married_separate', label: 'Married Filing Separately' },
                  { value: 'head_of_household', label: 'Head of Household' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-white cursor-pointer"
                  >
                    <input type="radio" name="filing_status" value={value} className="mr-3" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Link
                href="/supersonic-fast-cash/diy/start"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-white font-semibold transition-colors"
              >
                Back
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-brand-orange-600 hover:bg-brand-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
            <p className="text-sm text-black">
              <strong>Need help?</strong> Our tax professionals are available to assist you.{' '}
              <Link
                href="/supersonic-fast-cash/book-appointment"
                className="text-brand-blue-600 hover:underline"
              >
                Book an appointment
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
