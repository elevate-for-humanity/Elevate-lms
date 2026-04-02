'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Briefcase, MapPin, DollarSign, Clock, Users, ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';

const BENEFITS = [
  'Health Insurance', 'Dental Insurance', 'Vision Insurance',
  '401(k)', 'Paid Time Off', 'Training Provided',
  'Tuition Assistance', 'Flexible Schedule', 'Career Growth',
];

const WOTC_GROUPS = [
  'Veterans', 'SNAP Recipients', 'Long-term Unemployed', 'Ex-Felons',
  'Vocational Rehabilitation', 'Summer Youth', 'TANF Recipients', 'SSI Recipients',
];

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    job_title: '',
    department: '',
    employment_type: 'Full-time',
    job_description: '',
    location: '',
    remote_option: 'On-site only',
    schedule: '',
    hours_per_week: '',
    pay_type: 'Hourly',
    salary_min: '',
    salary_max: '',
    benefits: [] as string[],
    required_qualifications: '',
    preferred_qualifications: '',
    experience_level: 'Entry Level (No experience required)',
    education: 'No requirement',
    wotc_groups: WOTC_GROUPS.slice(), // all checked by default
    positions_available: '1',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleBenefit = (benefit: string) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.includes(benefit)
        ? prev.benefits.filter(b => b !== benefit)
        : [...prev.benefits, benefit],
    }));
  };

  const toggleWotc = (group: string) => {
    setForm(prev => ({
      ...prev,
      wotc_groups: prev.wotc_groups.includes(group)
        ? prev.wotc_groups.filter(g => g !== group)
        : [...prev.wotc_groups, group],
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/employer/jobs/new');
        return;
      }

      const { error: insertError } = await supabase.from('job_postings').insert({
        employer_id: user.id,
        job_title: form.job_title,
        job_description: form.job_description,
        location: form.location,
        employment_type: form.employment_type,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
        positions_available: parseInt(form.positions_available) || 1,
        status: isDraft ? 'draft' : 'active',
        metadata: {
          department: form.department,
          remote_option: form.remote_option,
          schedule: form.schedule,
          hours_per_week: form.hours_per_week,
          pay_type: form.pay_type,
          benefits: form.benefits,
          required_qualifications: form.required_qualifications,
          preferred_qualifications: form.preferred_qualifications,
          experience_level: form.experience_level,
          education: form.education,
          wotc_groups: form.wotc_groups,
        },
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push('/employer/jobs');
    } catch {
      setError('Failed to create job posting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer/dashboard" }, { label: "Jobs", href: "/employer/jobs" }, { label: "New Job" }]} />

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/employer/jobs" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-brand-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Post a New Job</h1>
              <p className="text-gray-600">Create a listing to attract qualified candidates</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-brand-red-50 border border-brand-red-200 rounded-lg text-brand-red-700">
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input type="text" name="job_title" value={form.job_title} onChange={handleChange} required
                  placeholder="e.g., Barber Apprentice, Medical Assistant"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select name="department" value={form.department} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option value="">Select department</option>
                    <option>Operations</option>
                    <option>Healthcare</option>
                    <option>IT</option>
                    <option>Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                  <select name="employment_type" value={form.employment_type} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Apprenticeship</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                <textarea name="job_description" value={form.job_description} onChange={handleChange} required rows={6}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Positions Available</label>
                <input type="number" name="positions_available" value={form.positions_available} onChange={handleChange} min="1"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent max-w-xs" />
              </div>
            </div>
          </div>

          {/* Location & Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Location & Schedule</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" name="location" value={form.location} onChange={handleChange} required
                      placeholder="City, State"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remote Options</label>
                  <select name="remote_option" value={form.remote_option} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>On-site only</option>
                    <option>Hybrid</option>
                    <option>Fully remote</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" name="schedule" value={form.schedule} onChange={handleChange}
                      placeholder="e.g., Mon-Fri 9am-5pm"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Week</label>
                  <input type="number" name="hours_per_week" value={form.hours_per_week} onChange={handleChange}
                    placeholder="40"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Compensation & Benefits</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pay Type</label>
                  <select name="pay_type" value={form.pay_type} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Hourly</option>
                    <option>Salary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="number" name="salary_min" value={form.salary_min} onChange={handleChange}
                      placeholder="15.00" step="0.01"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="number" name="salary_max" value={form.salary_max} onChange={handleChange}
                      placeholder="25.00" step="0.01"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Benefits Offered</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {BENEFITS.map((benefit) => (
                    <label key={benefit} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                      <input type="checkbox" checked={form.benefits.includes(benefit)} onChange={() => toggleBenefit(benefit)}
                        className="w-4 h-4 text-brand-blue-600 rounded" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Requirements</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Qualifications</label>
                <textarea name="required_qualifications" value={form.required_qualifications} onChange={handleChange} rows={4}
                  placeholder="List the must-have qualifications..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Qualifications</label>
                <textarea name="preferred_qualifications" value={form.preferred_qualifications} onChange={handleChange} rows={4}
                  placeholder="List nice-to-have qualifications..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select name="experience_level" value={form.experience_level} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Entry Level (No experience required)</option>
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <select name="education" value={form.education} onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>No requirement</option>
                    <option>High School / GED</option>
                    <option>Some College</option>
                    <option>Associate Degree</option>
                    <option>Bachelor Degree</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* WOTC Preferences */}
          <div className="bg-brand-blue-50 rounded-xl p-6 border border-brand-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-brand-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">WOTC Candidate Preferences</h2>
            </div>
            <p className="text-gray-600 mb-4">Select which WOTC-eligible groups you are open to hiring from:</p>
            <div className="grid md:grid-cols-2 gap-3">
              {WOTC_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-2 p-3 bg-white border rounded-lg cursor-pointer hover:border-brand-blue-300">
                  <input type="checkbox" checked={form.wotc_groups.includes(group)} onChange={() => toggleWotc(group)}
                    className="w-4 h-4 text-brand-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{group}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-white transition flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <div className="flex gap-4">
              <button type="submit" disabled={isSubmitting}
                className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
