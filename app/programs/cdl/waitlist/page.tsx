'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, Truck, Calendar, Clock, MapPin } from 'lucide-react';

export default function CDLWaitlistPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: 'Indiana',
    zip: '',
    currentLicense: 'none',
    employmentStatus: '',
    fundingSource: '',
    howHeard: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/programs/cdl/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-gray-900';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CDL Training', href: '/programs/cdl' }, { label: 'Waitlist' }]} />
        </div>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-3xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">You&apos;re on the Waitlist!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you, {formData.firstName}! You&apos;ve been added to the CDL Training waitlist for the
            <strong> October 2026 cohort</strong>. We&apos;ll send you updates as the start date approaches.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-gray-900 mb-2">What Happens Next</h3>
            <ul className="text-sm text-gray-600 text-left space-y-2">
              <li>1. You&apos;ll receive a confirmation email with program details</li>
              <li>2. We&apos;ll contact you about funding options (WIOA, grants, self-pay)</li>
              <li>3. Enrollment opens 60 days before the cohort start date</li>
              <li>4. You&apos;ll get priority enrollment as a waitlist member</li>
            </ul>
          </div>
          <Link href="/programs/cdl" className="text-orange-600 hover:text-orange-700 font-medium">
            ← Back to CDL Program Info
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'CDL Training', href: '/programs/cdl' }, { label: 'Waitlist' }]} />
      </div>

      {/* Hero */}
      <section className="relative bg-slate-900 text-white py-16 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/pages/programs-cdl-waitlist-hero.jpg" alt="CDL truck training" fill className="object-cover opacity-30" priority />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">CDL Training — October 2026 Cohort</h1>
          <p className="text-xl text-slate-200">Join the waitlist to reserve your spot in our next CDL Class A training program.</p>
        </div>
      </section>

      {/* Program Highlights */}
      <section className="py-10 bg-white border-b">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            <div>
              <Truck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900">Class A CDL</p>
              <p className="text-sm text-gray-500">Full commercial license</p>
            </div>
            <div>
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900">160 Hours</p>
              <p className="text-sm text-gray-500">Classroom + behind-the-wheel</p>
            </div>
            <div>
              <Calendar className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900">October 2026</p>
              <p className="text-sm text-gray-500">Next cohort start</p>
            </div>
            <div>
              <MapPin className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-gray-900">Indianapolis, IN</p>
              <p className="text-sm text-gray-500">Training location</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Join the Waitlist</h2>
          <p className="text-gray-600 text-center mb-8">Fill out the form below to reserve your spot. Waitlist members get priority enrollment.</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClass}>First Name <span className="text-red-500">*</span></label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last Name <span className="text-red-500">*</span></label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className={labelClass}>Email <span className="text-red-500">*</span></label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone <span className="text-red-500">*</span></label>
                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>City <span className="text-red-500">*</span></label>
                <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} required className={inputClass} />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State</label>
                <input type="text" id="state" name="state" value={formData.state} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="zip" className={labelClass}>ZIP <span className="text-red-500">*</span></label>
                <input type="text" id="zip" name="zip" value={formData.zip} onChange={handleChange} required className={inputClass} pattern="[0-9]{5}" />
              </div>
            </div>

            <div>
              <label htmlFor="currentLicense" className={labelClass}>Current Driver&apos;s License</label>
              <select id="currentLicense" name="currentLicense" value={formData.currentLicense} onChange={handleChange} className={inputClass}>
                <option value="none">No CDL — Regular license only</option>
                <option value="permit">CDL Learner&apos;s Permit</option>
                <option value="class_b">Class B CDL</option>
                <option value="class_a">Class A CDL (upgrading endorsements)</option>
              </select>
            </div>

            <div>
              <label htmlFor="employmentStatus" className={labelClass}>Employment Status</label>
              <select id="employmentStatus" name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} className={inputClass}>
                <option value="">Select...</option>
                <option value="employed_ft">Employed Full-Time</option>
                <option value="employed_pt">Employed Part-Time</option>
                <option value="unemployed">Unemployed</option>
                <option value="self_employed">Self-Employed</option>
              </select>
            </div>

            <div>
              <label htmlFor="fundingSource" className={labelClass}>How do you plan to pay?</label>
              <select id="fundingSource" name="fundingSource" value={formData.fundingSource} onChange={handleChange} className={inputClass}>
                <option value="">Select...</option>
                <option value="self_pay">Self-Pay</option>
                <option value="wioa">WIOA / Workforce Funding</option>
                <option value="va">VA / GI Bill</option>
                <option value="employer">Employer Sponsored</option>
                <option value="grant">Grant / Scholarship</option>
                <option value="not_sure">Not Sure — Need Help</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className={inputClass} rows={3} placeholder="Questions, special circumstances, etc." />
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <button type="submit" disabled={isSubmitting} className="w-full px-8 py-4 bg-orange-500 text-white rounded-lg font-bold text-lg hover:bg-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? 'Submitting...' : <>Join the Waitlist <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
