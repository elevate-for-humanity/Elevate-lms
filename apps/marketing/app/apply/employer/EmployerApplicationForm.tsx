'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployerApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    industry: '',
    city: '',
    website: '',
    employeeCount: '',
    interestedIn: '',
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
        body: JSON.stringify({ ...form, source: 'employer-application' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: 'Application received! We will contact you within 1-2 business days.' });
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
            <label htmlFor="companyName" className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
            <input type="text" id="companyName" name="companyName" required value={form.companyName} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
              placeholder="Acme Healthcare Inc." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
              <input type="text" id="contactName" name="contactName" required value={form.contactName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Jane Smith" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="jane@acmehc.com" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="(317) 314-3757" />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">City</label>
              <input type="text" id="city" name="city" value={form.city} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Indianapolis" />
            </div>
          </div>
          <div>
            <label htmlFor="interestedIn" className="block text-sm font-medium text-slate-700 mb-1">Interested In</label>
            <select id="interestedIn" name="interestedIn" value={form.interestedIn} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 bg-white">
              <option value="">Select an option</option>
              <option value="hire_graduates">Hiring our graduates</option>
              <option value="sponsor_apprentice">Sponsoring an apprentice</option>
              <option value="ojt">On-the-Job Training reimbursement</option>
              <option value="cohort">Custom training cohort</option>
              <option value="multiple">Multiple options</option>
            </select>
          </div>
          {result?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}
          <button type="submit" disabled={submitting}
            className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
