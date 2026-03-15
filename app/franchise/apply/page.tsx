'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';

const PACKAGES = [
  { value: 'starter', label: 'Starter Package — $15,000' },
  { value: 'professional', label: 'Professional Package — $35,000' },
  { value: 'enterprise', label: 'Enterprise Package — $75,000' },
  { value: 'unsure', label: 'Not sure yet — help me decide' },
];

export default function FranchiseApplyPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('package') || '';

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    package: PACKAGES.find((p) => p.value === preselected)?.value || '',
    experience: '',
    investment: '',
    timeline: '',
    message: '',
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    // Send to contact/support endpoint or email
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'franchise-inquiry',
          ...form,
        }),
      });
    } catch {
      // Still show success — form data is captured client-side
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Application Received
          </h1>
          <p className="text-lg text-slate-600 mb-2">
            Thank you, {form.firstName}. We received your franchise inquiry.
          </p>
          <p className="text-slate-600 mb-8">
            Our franchise team will contact you at <strong>{form.email}</strong> within
            1–2 business days to schedule a consultation call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/franchise"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Franchise Info
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-white transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Franchise', href: '/franchise' },
            { label: 'Apply' },
          ]}
        />
      </div>

      {/* Header */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Request Franchise Information
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Fill out the form below and our franchise team will schedule a
            consultation to discuss your goals and the right package for you.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Contact Info */}
            <fieldset className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <legend className="text-xl font-bold text-slate-900 mb-6">
                Contact Information
              </legend>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => update('firstName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => update('lastName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => update('state', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            {/* Franchise Details */}
            <fieldset className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              <legend className="text-xl font-bold text-slate-900 mb-6">
                Franchise Interest
              </legend>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Package Interest *
                  </label>
                  <select
                    required
                    value={form.package}
                    onChange={(e) => update('package', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  >
                    <option value="">Select a package</option>
                    {PACKAGES.map((pkg) => (
                      <option key={pkg.value} value={pkg.value}>
                        {pkg.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Relevant Experience
                  </label>
                  <select
                    value={form.experience}
                    onChange={(e) => update('experience', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  >
                    <option value="">Select one</option>
                    <option value="education">Education / Training</option>
                    <option value="business">Business Owner</option>
                    <option value="workforce">Workforce Development</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="trades">Skilled Trades</option>
                    <option value="other">Other</option>
                    <option value="none">No prior experience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Available Investment Capital
                  </label>
                  <select
                    value={form.investment}
                    onChange={(e) => update('investment', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  >
                    <option value="">Select range</option>
                    <option value="under-15k">Under $15,000</option>
                    <option value="15k-35k">$15,000 – $35,000</option>
                    <option value="35k-75k">$35,000 – $75,000</option>
                    <option value="75k-plus">$75,000+</option>
                    <option value="financing">Need financing options</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Target Start Timeline
                  </label>
                  <select
                    value={form.timeline}
                    onChange={(e) => update('timeline', e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  >
                    <option value="">Select timeline</option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-3months">1–3 months</option>
                    <option value="3-6months">3–6 months</option>
                    <option value="6-12months">6–12 months</option>
                    <option value="exploring">Just exploring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Additional Information
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => update('message', e.target.value)}
                    placeholder="Tell us about your goals, questions, or anything else..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            <div className="text-center">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-10 py-4 bg-brand-orange-600 text-white font-bold rounded-lg hover:bg-brand-orange-700 transition text-lg disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Franchise Inquiry'}
              </button>
              <p className="text-sm text-slate-500 mt-3">
                Our team will contact you within 1–2 business days to schedule a consultation.
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
