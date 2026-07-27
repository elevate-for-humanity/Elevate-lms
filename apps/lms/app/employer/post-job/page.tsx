'use client';

export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { useState } from 'react';
import { Building2, MapPin, DollarSign, Clock, Briefcase, Send } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Post a Job | Elevate for Humanity',
  description: 'Post job openings to connect with trained Elevate graduates.',
};

const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const shifts = ['Day', 'Evening', 'Night', 'Rotating', 'Flexible'];
const programs = ['CNA', 'HVAC', 'Barber', 'CDL', 'IT', 'All Programs'];

export default function PostJobPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Breadcrumbs items={[{ label: 'Employer Portal', href: '/employer' }, { label: 'Post Job' }]} />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm p-12">
            <div className="w-16 h-16 bg-brand-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-8 h-8 text-brand-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-black mb-4">Job Posted Successfully!</h1>
            <p className="text-slate-600 mb-8">
              Your job posting has been submitted. Our team will review it and connect you with qualified candidates from our training programs.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/employer/jobs" className="bg-brand-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-brand-blue-700">
                View My Jobs
              </Link>
              <button onClick={() => setSubmitted(false)} className="bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300">
                Post Another Job
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Employer Portal', href: '/employer' }, { label: 'Post Job' }]} />
      
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-black">Post a Job</h1>
          <p className="text-slate-600 mt-1">Connect with trained candidates from our workforce programs.</p>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="max-w-2xl mx-auto px-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
            {/* Company Info */}
            <div>
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-blue-600" />
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                  <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Your company name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email *</label>
                  <input type="email" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="hr@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Website</label>
                  <input type="url" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="https://company.com" />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div>
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-blue-600" />
                Job Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
                  <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="e.g., Certified Nursing Assistant" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Description *</label>
                  <textarea required rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Describe the role, responsibilities, and requirements..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Job Type *</label>
                    <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                      <option value="">Select type</option>
                      {jobTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Shift *</label>
                    <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                      <option value="">Select shift</option>
                      {shifts.map(shift => <option key={shift} value={shift}>{shift}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Compensation */}
            <div>
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-blue-600" />
                Location & Compensation
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Location *</label>
                  <input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="City, State or Remote" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="e.g., $18-22/hr" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Benefits</label>
                    <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Health, 401k, etc." />
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Preferences */}
            <div>
              <h2 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-blue-600" />
                Candidate Preferences
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Training Programs</label>
                  <div className="flex flex-wrap gap-2">
                    {programs.map(program => (
                      <label key={program} className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        <input type="checkbox" value={program} className="rounded border-slate-300 text-brand-blue-600 focus:ring-brand-blue-500" />
                        <span className="text-sm text-slate-700">{program}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Requirements</label>
                  <textarea rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent" placeholder="Any additional qualifications or preferences..." />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-blue-600 hover:bg-brand-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Post Job
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

