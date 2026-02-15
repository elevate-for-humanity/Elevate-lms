'use client';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useState } from 'react';
import Link from 'next/link';



export default function CareersApplyPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/supersonic-fast-cash/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      setSuccess(true);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">Thank you for applying. We will contact you within 48 hours.</p>
          <Link href="/supersonic-fast-cash/careers" className="text-orange-600 hover:underline">
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Supersonic Fast Cash", href: "/supersonic-fast-cash" }, { label: "Apply" }]} />
      </div>
{/* Hero */}
      <section className="relative h-[300px] w-full overflow-hidden">
        <Image src="/images/heroes/alumni.jpg" alt="Apply for Career" fill className="object-cover" quality={85} priority />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-6 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Apply Now
            </h1>
            <p className="text-xl">
              Start your career with Supersonic Fast Cash
            </p>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Position Applying For *
                </label>
                <select
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a position</option>
                  <option value="tax-preparer">Tax Preparer</option>
                  <option value="office-staff">Office Staff</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="sub-office">Sub-Office Operator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Years of Experience
                </label>
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Additional Information
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
                <Link
                  href="/supersonic-fast-cash/careers"
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-black px-8 py-3 rounded-lg font-semibold transition-colors text-center"
                >
                  Back to Careers
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
