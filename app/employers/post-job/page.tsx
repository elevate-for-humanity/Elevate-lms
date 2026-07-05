import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { postJobAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/employer/post-job' },
  title: 'Post a Job',
  description: 'Post job opportunities for program graduates.',
};

export default async function PostJobPage() {
  await requireRole(['employer', 'admin', 'super_admin']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-500">
              <li><Link href="/employer/dashboard" className="hover:text-slate-900">Employer</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Post a Job</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900">Post a Job</h1>
          <p className="text-slate-500 mt-2">
            Your posting appears on the public job board and is visible to Elevate graduates.
          </p>
        </div>

        <form action={postJobAction} className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Job Details</h2>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Job Title <span className="text-red-500">*</span></label>
              <input name="title" type="text" required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., HVAC Technician, Medical Assistant" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Description <span className="text-red-500">*</span></label>
              <textarea name="description" rows={5} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the role, responsibilities, and what a typical day looks like." />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1.5">Requirements</label>
              <textarea name="requirements" rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Required certifications, experience, or skills." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Employment Type</label>
                <select name="job_type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="apprenticeship">Apprenticeship</option>
                  <option value="ojt">On-the-Job Training (OJT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Work Location</label>
                <select name="remote_type" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Location</label>
                <input name="location" type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="City, State" defaultValue="Indianapolis, IN" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Salary / Pay Range</label>
                <input name="salary_range" type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., $18–$25/hr or $45,000–$55,000/yr" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">Application Deadline</label>
                <input name="deadline" type="date"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-1.5">External Application URL</label>
                <input name="application_url" type="url"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourcompany.com/careers/..." />
                <p className="text-xs text-slate-400 mt-1">Leave blank to use the Elevate application form.</p>
              </div>
            </div>
          </div>

          {/* Workforce programs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Workforce Programs</h2>
              <p className="text-xs text-slate-500 mt-1">
                Check all that apply. These badges appear on the public job board and help match
                candidates eligible for funding.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: 'is_ojt',
                  label: 'On-the-Job Training (OJT)',
                  desc: 'WIOA-funded — employer receives up to 50% wage reimbursement while training a new hire. Requires WorkOne agreement.',
                },
                {
                  name: 'is_apprenticeship',
                  label: 'Registered Apprenticeship',
                  desc: 'DOL-registered position. Apprentice earns while learning toward a nationally recognized credential.',
                },
                {
                  name: 'wotc_eligible',
                  label: 'WOTC-Eligible Position',
                  desc: 'Work Opportunity Tax Credit — employer may claim up to $9,600 per eligible hire. Elevate assists with IRS Form 8850 screening.',
                },
                {
                  name: 'wioa_approved',
                  label: 'WIOA-Approved Position',
                  desc: 'Approved for WIOA-funded participants referred through WorkOne or Elevate.',
                },
              ].map(({ name, label, desc }) => (
                <label key={name} className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name={name} value="true"
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="submit"
              className="flex-1 bg-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-800 transition-colors text-sm">
              Post Job →
            </button>
            <Link href="/employer/dashboard"
              className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
