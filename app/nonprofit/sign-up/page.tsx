

'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';



export default function SignUpPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      interest: 'nonprofit_workshop',
      message: `Workshop signup: ${formData.get('workshop') || 'General interest'}`,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-black mb-4">Thank You!</h2>
          <p className="text-lg text-black">
            We've received your registration. You'll receive a confirmation
            email shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Nonprofit', href: '/nonprofit' }, { label: 'Sign Up' }]} />
        </div>
      </div>

      <div className="py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-black mb-6 text-center">
          Sign Up for Workshops
        </h1>
        <p className="text-lg text-black mb-12 text-center">
          Join our healing community and start your wellness journey
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-lg p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Full Name *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Phone
            </label>
            <input
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Workshop Interest *
            </label>
            <select
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            >
              <option value="">Select a workshop</option>
              <option>Mindfulness & Meditation</option>
              <option>Trauma Recovery Support Group</option>
              <option>Holistic Wellness Workshop</option>
              <option>All Workshops</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-2">
              Tell us about yourself (optional)
            </label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-600 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-brand-blue-600 text-white py-4 rounded-lg text-lg font-bold hover:bg-brand-blue-700 transition-colors"
          >
            Submit Registration
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
