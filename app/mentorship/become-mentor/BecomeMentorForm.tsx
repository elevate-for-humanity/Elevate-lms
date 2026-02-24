'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

const PROGRAM_AREAS = [
  'Barbering', 'HVAC', 'CDL/Trucking', 'CNA/Healthcare',
  'Electrical', 'Welding', 'IT/Cybersecurity', 'Tax Preparation',
  'Business/Entrepreneurship', 'Esthetics', 'Other',
];

export default function BecomeMentorForm() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    employer: '',
    job_title: '',
    years_experience: '',
    program_area: '',
    availability: '',
    why_mentor: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('mentorships').insert({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        employer: form.employer || null,
        job_title: form.job_title || null,
        years_experience: form.years_experience ? parseInt(form.years_experience) : null,
        program_area: form.program_area,
        availability: form.availability,
        why_mentor: form.why_mentor || null,
        status: 'pending',
      });

      if (insertError) {
        // If table doesn't exist, fall back to inquiries table
        if (insertError.code === '42P01') {
          const { error: fallbackError } = await supabase.from('inquiries').insert({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone || null,
            subject: 'Mentor Application',
            message: `Program area: ${form.program_area}\nEmployer: ${form.employer}\nTitle: ${form.job_title}\nExperience: ${form.years_experience} years\nAvailability: ${form.availability}\nWhy: ${form.why_mentor}`,
            source: 'become-mentor',
          });
          if (fallbackError && fallbackError.code !== '42P01') {
            throw fallbackError;
          }
        } else {
          throw insertError;
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again or call (317) 296-8560.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white border rounded-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-brand-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Application Received</h3>
        <p className="text-slate-600 mb-4">
          Thank you for volunteering to mentor, {form.first_name}. We&apos;ll review your
          application and contact you within 5 business days.
        </p>
        <p className="text-sm text-slate-500">
          Questions? Call <a href="tel:3172968560" className="text-brand-blue-600 hover:underline">(317) 296-8560</a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <h3 className="text-xl font-bold text-slate-900 mb-6">Mentor Application</h3>

      {error && (
        <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-800 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-semibold text-slate-900 mb-1">First Name *</label>
            <input type="text" id="first_name" name="first_name" required value={form.first_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-semibold text-slate-900 mb-1">Last Name *</label>
            <input type="text" id="last_name" name="last_name" required value={form.last_name} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-1">Email *</label>
          <input type="email" id="email" name="email" required value={form.email} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-900 mb-1">Phone</label>
          <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employer" className="block text-sm font-semibold text-slate-900 mb-1">Employer</label>
            <input type="text" id="employer" name="employer" value={form.employer} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>
          <div>
            <label htmlFor="job_title" className="block text-sm font-semibold text-slate-900 mb-1">Job Title</label>
            <input type="text" id="job_title" name="job_title" value={form.job_title} onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
          </div>
        </div>

        <div>
          <label htmlFor="years_experience" className="block text-sm font-semibold text-slate-900 mb-1">Years of Experience *</label>
          <input type="number" id="years_experience" name="years_experience" required min="1" value={form.years_experience} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
        </div>

        <div>
          <label htmlFor="program_area" className="block text-sm font-semibold text-slate-900 mb-1">Program Area *</label>
          <select id="program_area" name="program_area" required value={form.program_area} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
            <option value="">Select your area of expertise</option>
            {PROGRAM_AREAS.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-semibold text-slate-900 mb-1">Availability *</label>
          <select id="availability" name="availability" required value={form.availability} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm">
            <option value="">How often can you meet?</option>
            <option value="weekly">Weekly (1 hour)</option>
            <option value="biweekly">Every 2 weeks (1 hour)</option>
            <option value="monthly">Monthly (1–2 hours)</option>
            <option value="flexible">Flexible / as needed</option>
          </select>
        </div>

        <div>
          <label htmlFor="why_mentor" className="block text-sm font-semibold text-slate-900 mb-1">Why do you want to mentor?</label>
          <textarea id="why_mentor" name="why_mentor" rows={3} value={form.why_mentor} onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            placeholder="Tell us about your motivation..." />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>

        <p className="text-xs text-slate-500 text-center">
          By submitting, you agree to a background check and our{' '}
          <a href="/privacy-policy" className="text-brand-blue-600 hover:underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  );
}
