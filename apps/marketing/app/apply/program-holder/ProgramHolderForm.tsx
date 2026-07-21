'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProgramHolderForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    orgName: '',
    contactName: '',
    email: '',
    phone: '',
    orgType: '',
    city: '',
    licenseNumber: '',
    yearsInBusiness: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'program-holder-application' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: 'Application received! We will review and contact you within 2-3 business days.' });
        setTimeout(() => router.push('/apply/success'), 2000);
      } else {
        setResult({ success: false, error: data.error || 'Something went wrong.' });
      }
    } catch {
      setResult({ success: false, error: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {result?.success ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Application Received!</h3>
          <p className="text-slate-600">{result.message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1">Organization Name *</label>
            <input type="text" id="orgName" name="orgName" required value={form.orgName} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
              placeholder="XYZ Training Center LLC" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
              <input type="text" id="contactName" name="contactName" required value={form.contactName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
                placeholder="jane@xyztraining.com" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
                placeholder="(317) 555-0123" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" id="city" name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
                placeholder="Indianapolis" />
            </div>
          </div>
          <div>
            <label htmlFor="orgType" className="block text-sm font-medium text-slate-700 mb-1">Organization Type</label>
            <select id="orgType" name="orgType" value={form.orgType} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500 bg-white">
              <option value="">Select type</option>
              <option value="barbershop">Barbershop / Salon</option>
              <option value="healthcare">Healthcare Facility</option>
              <option value="school">Vocational School</option>
              <option value="community_org">Community Organization</option>
              <option value="employer">Employer</option>
              <option value="workforce_agency">Workforce Agency</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Program Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-purple-500"
              placeholder="Tell us about your organization and the programs you'd like to offer..." />
          </div>
          {result?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}
          <button type="submit" disabled={submitting}
            className="w-full bg-brand-purple-600 hover:bg-brand-purple-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
