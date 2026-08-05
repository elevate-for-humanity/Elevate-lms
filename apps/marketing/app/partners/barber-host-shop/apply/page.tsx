'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const PROGRAM_OPTIONS = [
  { value: 'barber', label: 'Barber Apprenticeship' },
  { value: 'cosmetology', label: 'Cosmetology Apprenticeship' },
  { value: 'esthetician', label: 'Esthetician Apprenticeship' },
  { value: 'nail', label: 'Nail Technician Apprenticeship' },
  { value: 'multiple', label: 'Multiple Programs' },
];

const INDUSTRY_OPTIONS = [
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'salon', label: 'Salon / Day Spa' },
  { value: 'esthetics_spa', label: 'Esthetics Spa' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'mobile', label: 'Mobile / Booth Rental' },
  { value: 'other', label: 'Other' },
];

export default function BarberHostShopApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    city: '',
    state: 'Indiana',
    industryType: '',
    programs: [] as string[],
    licenseNumber: '',
    yearsInBusiness: '',
    numberOfChairs: '',
    hasInsurance: '',
    howHeard: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    const { value, checked } = e.target;
    setForm(prev => ({
      ...prev,
      programs: checked
        ? [...prev.programs, value]
        : prev.programs.filter(p => p !== value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'host-shop-application',
          businessName: form.businessName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          interestedIn: `host-shop: ${form.programs.join(', ')}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ success: true, message: 'Application received! We will review your application and contact you within 2-3 business days.' });
        const ref = data.referenceNumber || '';
        const prog = data.program || '';
        const q = new URLSearchParams();
        if (ref) q.set('ref', ref);
        if (prog) q.set('program', prog);
        const suffix = q.toString() ? '?' + q.toString() : '';
        setTimeout(() => router.push('/apply/success' + suffix), 2000);
      } else {
        setResult({ success: false, error: data.error || 'Something went wrong. Please try again.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-brand-blue-900 to-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-red-600/20 text-brand-red-300 px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Building2 className="w-4 h-4" /> Host Shop Application
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            Apply to Become a Host Shop
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Train the next generation of beauty professionals in your shop. Complete the application below and we will review within 2-3 business days.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Requirements reminder */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-8">
          <p className="text-sm text-blue-900 font-medium mb-2">Before you apply, confirm your shop meets these requirements:</p>
          <ul className="text-sm text-blue-800 grid sm:grid-cols-2 gap-1">
            <li>✓ Licensed business in Indiana</li>
            <li>✓ Licensed supervisor with 3+ years experience</li>
            <li>✓ Physical space for an apprentice workstation</li>
            <li>✓ Commercial liability insurance</li>
          </ul>
        </div>

        {/* Form */}
        {result?.success ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Application Received!</h2>
            <p className="text-slate-600 mb-6">{result.message}</p>
            <button onClick={() => router.push('/')} className="text-brand-blue-600 font-medium hover:underline">
              Return to Homepage →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Business Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="businessName" className="block text-sm font-medium text-slate-700 mb-1">Business Name *</label>
                    <input type="text" id="businessName" name="businessName" required value={form.businessName} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="Classic Cuts Barbershop" />
                  </div>
                  <div>
                    <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                    <input type="text" id="contactName" name="contactName" required value={form.contactName} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="John Smith" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="john@classiccuths.com" />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input type="tel" id="phone" name="phone" required value={form.phone} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="(317) 555-0100" />
                  </div>
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                    <input type="text" id="city" name="city" required value={form.city} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="Indianapolis" />
                  </div>
                  <div>
                    <label htmlFor="industryType" className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                    <select id="industryType" name="industryType" value={form.industryType} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white">
                      <option value="">Select type</option>
                      {INDUSTRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                    <input type="text" id="licenseNumber" name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="BS-123456" />
                  </div>
                  <div>
                    <label htmlFor="yearsInBusiness" className="block text-sm font-medium text-slate-700 mb-1">Years in Business</label>
                    <input type="number" id="yearsInBusiness" name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="5" min="0" />
                  </div>
                  <div>
                    <label htmlFor="numberOfChairs" className="block text-sm font-medium text-slate-700 mb-1">Number of Chairs</label>
                    <input type="number" id="numberOfChairs" name="numberOfChairs" value={form.numberOfChairs} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                      placeholder="4" min="1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="hasInsurance" className="block text-sm font-medium text-slate-700 mb-1">Do you have commercial liability insurance?</label>
                    <select id="hasInsurance" name="hasInsurance" value={form.hasInsurance} onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white">
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="pending">In progress</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Program Interest */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Program Interest *</h3>
                <p className="text-sm text-slate-600 mb-3">Which apprenticeship programs would you like to host? Select all that apply.</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {PROGRAM_OPTIONS.map(p => (
                    <label key={p.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:bg-brand-blue-50 has-[:checked]:border-brand-blue-300">
                      <input type="checkbox" name="programs" value={p.value} checked={form.programs.includes(p.value)} onChange={handleCheckbox}
                        className="w-4 h-4 text-brand-blue-600 rounded border-slate-300 focus:ring-brand-blue-500" />
                      <span className="text-sm font-medium text-slate-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Additional Information</h3>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Tell us about your shop and why you want to host apprentices</label>
                  <textarea id="message" name="message" rows={4} value={form.message} onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                    placeholder="We have been in business for 15 years and love mentoring new stylists..." />
                </div>
                <div className="mt-4">
                  <label htmlFor="howHeard" className="block text-sm font-medium text-slate-700 mb-1">How did you hear about us?</label>
                  <select id="howHeard" name="howHeard" value={form.howHeard} onChange={handleChange}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500 bg-white">
                    <option value="">Select</option>
                    <option value="google">Google Search</option>
                    <option value="referral">Referral</option>
                    <option value="social">Social Media</option>
                    <option value="community">Community Event</option>
                    <option value="workforce">Workforce Board</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {result?.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {result.error}
                </div>
              )}

              <button type="submit" disabled={submitting || form.programs.length === 0}
                className="w-full bg-brand-red-600 hover:bg-brand-red-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                {submitting ? 'Submitting...' : 'Submit Host Shop Application'}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>

              <p className="text-xs text-slate-500 text-center">
                By submitting, you agree to our{' '}
                <a href="/legal/program-host-agreement" className="underline">Host Shop Agreement terms</a>.
                We will contact you within 2-3 business days to schedule a review.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
