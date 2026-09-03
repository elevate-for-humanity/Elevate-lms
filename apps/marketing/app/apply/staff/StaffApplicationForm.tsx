'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StaffApplicationForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    city: '',
    experience: '',
    resume: '',
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
      const res = await fetch('/api/staff/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setResult({ success: true, message: 'Application received! Our HR team will review and contact you within 3-5 business days.' });
        const ref = data.referenceNumber || data.applicationId || '';
        const q = new URLSearchParams({ type: 'staff' });
        if (ref) q.set('ref', ref);
        setTimeout(() => router.push('/apply/success?' + q.toString()), 2000);
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
              <input type="text" id="firstName" name="firstName" required value={form.firstName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500"
                placeholder="Jane" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
              <input type="text" id="lastName" name="lastName" required value={form.lastName} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500"
                placeholder="Smith" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500"
                placeholder="jane.smith@email.com" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500"
                placeholder="(317) 314-3757" />
            </div>
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">Position of Interest</label>
            <select id="position" name="position" value={form.position} onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500 bg-white">
              <option value="">Select position</option>
              <option value="instructor">Instructor</option>
              <option value="admissions">Admissions Coordinator</option>
              <option value="career_services">Career Services</option>
              <option value="admin">Administrative</option>
              <option value="compliance">Compliance</option>
              <option value="technology">Technology</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="experience" className="block text-sm font-medium text-slate-700 mb-1">Experience / Notes</label>
            <textarea id="experience" name="experience" value={form.experience} onChange={handleChange} rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-teal-500"
              placeholder="Tell us about your relevant experience..." />
          </div>
          {result?.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{result.error}</div>
          )}
          <button type="submit" disabled={submitting}
            className="w-full bg-brand-teal-600 hover:bg-brand-teal-700 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl">
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}
    </div>
  );
}
