
import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Building, Save } from 'lucide-react';
import { createJob } from '../actions';

export const metadata: Metadata = {
  title: 'Post New Job | Admin',
  description: 'Create a new job listing.',
  robots: { index: false, follow: false },
};

export default function AdminNewJobPage() {

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Jobs', href: '/admin/jobs' },
            { label: 'New Job' },
          ]} />
        </div>

        <Link href="/admin/jobs" className="text-sm text-brand-blue-600 hover:text-brand-blue-700 flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Post New Job</h1>

        <form action={createJob} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Job Title *</span>
            </label>
            <input name="title" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="e.g., HVAC Technician Apprentice" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Company *</span>
              </label>
              <input name="company" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Employer name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location *</span>
              </label>
              <input name="location" required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Indianapolis, IN" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
              <select name="type" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500">
                <option value="full_time">Full-Time</option>
                <option value="part_time">Part-Time</option>
                <option value="apprenticeship">Apprenticeship</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Min Salary</span>
              </label>
              <input name="salary_min" type="number" step="1000" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="35000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> Max Salary</span>
              </label>
              <input name="salary_max" type="number" step="1000" min="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="55000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
            <textarea name="description" required rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Describe the role, responsibilities, and expectations..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea name="requirements" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-500" placeholder="Required qualifications, certifications, experience..." />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link href="/admin/jobs" className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</Link>
            <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-brand-blue-600 text-white rounded-lg text-sm font-medium hover:bg-brand-blue-700">
              <Save className="w-4 h-4" /> Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
