'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Clock, Shield, Phone } from 'lucide-react';

export default function RefundApplyPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    filingStatus: '',
    employmentType: '',
    estimatedIncome: '',
    hasW2: false,
    has1099: false,
    hasDependents: false,
    dependentCount: '',
    preferredContact: 'phone',
    preferredTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/supersonic/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 flex-shrink-0">•</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Received!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for applying. One of our tax professionals will contact you within 15 minutes during business hours to discuss your refund options.
          </p>
          <div className="bg-white rounded-xl border p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Need immediate assistance?</p>
            <a href="/support" className="text-2xl font-bold text-orange-600 hover:text-orange-700">
              Visit Support Center
            </a>
          </div>
          <Link href="/supersonic-fast-cash" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to Supersonic Fast Cash
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
      <section className="bg-slate-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/supersonic-fast-cash" className="inline-flex items-center gap-2 text-orange-100 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Get Your Tax Refund Today
          </h1>
          <p className="text-xl text-orange-100">
            Fill out this quick form and get up to $7,500 in as little as 15 minutes.
          </p>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="bg-white border-b py-4">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Up to $7,500</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">15 Min Approval</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-brand-blue-600" />
              <span className="text-sm font-medium">0% Interest</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <span className="text-sm font-medium">PTIN-Credentialed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Your Information</h2>
            
            {/* Name */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Contact */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 mt-8">Tax Information</h2>

            {/* Filing Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status *</label>
              <select
                required
                value={formData.filingStatus}
                onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select filing status</option>
                <option value="single">Single</option>
                <option value="married-joint">Married Filing Jointly</option>
                <option value="married-separate">Married Filing Separately</option>
                <option value="head-of-household">Head of Household</option>
                <option value="widow">Qualifying Widow(er)</option>
              </select>
            </div>

            {/* Employment */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
              <select
                required
                value={formData.employmentType}
                onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select employment type</option>
                <option value="w2-employee">W-2 Employee</option>
                <option value="self-employed">Self-Employed / 1099</option>
                <option value="both">Both W-2 and Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="retired">Retired</option>
              </select>
            </div>

            {/* Estimated Income */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated 2024 Income *</label>
              <select
                required
                value={formData.estimatedIncome}
                onChange={(e) => setFormData({ ...formData, estimatedIncome: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select income range</option>
                <option value="under-15k">Under $15,000</option>
                <option value="15k-30k">$15,000 - $30,000</option>
                <option value="30k-50k">$30,000 - $50,000</option>
                <option value="50k-75k">$50,000 - $75,000</option>
                <option value="75k-100k">$75,000 - $100,000</option>
                <option value="over-100k">Over $100,000</option>
              </select>
            </div>

            {/* Documents */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have these documents?</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.hasW2}
                    onChange={(e) => setFormData({ ...formData, hasW2: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-gray-700">W-2 from employer(s)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.has1099}
                    onChange={(e) => setFormData({ ...formData, has1099: e.target.checked })}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-gray-700">1099 forms (if self-employed)</span>
                </label>
              </div>
            </div>

            {/* Dependents */}
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={formData.hasDependents}
                  onChange={(e) => setFormData({ ...formData, hasDependents: e.target.checked })}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-gray-700 font-medium">I have dependents (children, etc.)</span>
              </label>
              {formData.hasDependents && (
                <select
                  value={formData.dependentCount}
                  onChange={(e) => setFormData({ ...formData, dependentCount: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">How many dependents?</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5+">5 or more</option>
                </select>
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 mt-8">Contact Preference</h2>

            {/* Preferred Contact */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">How should we contact you? *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preferredContact"
                    value="phone"
                    checked={formData.preferredContact === 'phone'}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">Phone</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preferredContact"
                    value="text"
                    checked={formData.preferredContact === 'text'}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">Text</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preferredContact"
                    value="email"
                    checked={formData.preferredContact === 'email'}
                    onChange={(e) => setFormData({ ...formData, preferredContact: e.target.value })}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="text-gray-700">Email</span>
                </label>
              </div>
            </div>

            {/* Best Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Best time to reach you</label>
              <select
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (9am - 12pm)</option>
                <option value="afternoon">Afternoon (12pm - 5pm)</option>
                <option value="evening">Evening (5pm - 8pm)</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Get My Refund Now →'}
            </button>

            <p className="text-center text-sm text-gray-500 mt-4">
              By submitting, you agree to be contacted about your tax refund.
            </p>
          </form>

          {/* Call CTA */}
          <div className="mt-8 bg-orange-50 rounded-xl p-6 text-center">
            <p className="text-gray-600 mb-2">Prefer to talk to someone now?</p>
            <a href="/support" className="inline-flex items-center gap-2 text-2xl font-bold text-orange-600 hover:text-orange-700">
              <Phone className="w-6 h-6" />
              Visit Support Center
            </a>
            <p className="text-sm text-gray-500 mt-2">Mon-Fri 9am-8pm, Sat 9am-5pm, Sun 12pm-5pm</p>
          </div>
        </div>
      </section>
    </div>
  );
}
