'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getActivePrograms } from '@/lib/program-registry';

interface StudentIntakeData {
  fullName: string;
  email: string;
  phone: string;
  programInterest: string;
  employmentStatus?: string;
  barriers?: string[];
  preferredLocation?: string;
  notes?: string;
}

export function InstructorIntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<StudentIntakeData>({
    fullName: '',
    email: '',
    phone: '',
    programInterest: '',
    employmentStatus: '',
    barriers: [],
    preferredLocation: '',
    notes: '',
  });

  const PROGRAMS = getActivePrograms().map((p) => p.name);

  const EMPLOYMENT_OPTIONS = ['Employed', 'Unemployed', 'Self-employed', 'Student', 'Other'];

  const BARRIERS = [
    'Transportation',
    'Childcare',
    'Technology access',
    'Language barrier',
    'Disability accommodation',
    'Financial constraints',
    'Family responsibilities',
    'Other',
  ];

  const handleChange = (
    field: keyof StudentIntakeData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const toggleBarrier = (barrier: string) => {
    setFormData((prev) => ({
      ...prev,
      barriers: prev.barriers?.includes(barrier)
        ? prev.barriers.filter((b) => b !== barrier)
        : [...(prev.barriers || []), barrier],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone is required');
      return;
    }
    if (!formData.programInterest) {
      setError('Program interest is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit to intake API
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          program_interest: formData.programInterest,
          employment_status: formData.employmentStatus || null,
          barriers: formData.barriers || [],
          preferred_location: formData.preferredLocation || null,
          notes: formData.notes || null,
          source: 'instructor-intake',
          funding_needed: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit intake form');
      }

      setSuccess(true);
      setSubmitted(true);
      logger.info('[InstructorIntakeForm] Student intake submitted', {
        studentEmail: formData.email,
        program: formData.programInterest,
      });

      // Reset form after success
      setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          programInterest: '',
          employmentStatus: '',
          barriers: [],
          preferredLocation: '',
          notes: '',
        });
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      logger.error('[InstructorIntakeForm] Submission failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="w-5 h-5 rounded-full bg-emerald-600 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-emerald-900">Student intake submitted</p>
            <p className="text-sm text-emerald-800">
              {formData.fullName} has been added to the enrollment pipeline.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              disabled={loading || submitted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              disabled={loading || submitted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              disabled={loading || submitted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Program Interest *
            </label>
            <select
              value={formData.programInterest}
              onChange={(e) => handleChange('programInterest', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
              disabled={loading || submitted}
            >
              <option value="">Select a program</option>
              {PROGRAMS.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employment & Barriers */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Background Information</h3>
        
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Employment Status
          </label>
          <select
            value={formData.employmentStatus || ''}
            onChange={(e) => handleChange('employmentStatus', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            disabled={loading || submitted}
          >
            <option value="">Select status</option>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Barriers to Employment (select all that apply)
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            {BARRIERS.map((barrier) => (
              <label key={barrier} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.barriers?.includes(barrier) || false}
                  onChange={() => toggleBarrier(barrier)}
                  disabled={loading || submitted}
                  className="w-4 h-4 rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500"
                />
                <span className="text-sm text-slate-700">{barrier}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <h3 className="text-base font-semibold text-slate-900 mb-4">Additional Information</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Preferred Location
          </label>
          <input
            type="text"
            value={formData.preferredLocation || ''}
            onChange={(e) => handleChange('preferredLocation', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            disabled={loading || submitted}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
            rows={4}
            disabled={loading || submitted}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || submitted}
          className="px-6 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 disabled:bg-slate-400 font-semibold flex items-center gap-2 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Submitting...' : 'Add Student to Intake'}
        </button>
      </div>
    </form>
  );
}
