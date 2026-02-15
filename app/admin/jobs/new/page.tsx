import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, DollarSign, Building, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Post New Job | Admin',
  description: 'Create a new job listing.',
  robots: { index: false, follow: false },
};

export default function AdminNewJobPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
<div className="max-w-3xl mx-auto">
        <Link href="/admin/jobs" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-brand-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
            <p className="text-gray-600">Create a job listing for partner employers</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Job Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Barber Apprentice"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employer *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employers..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Healthcare</option>
                    <option>Barbering & Cosmetology</option>
                    <option>IT & Technology</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                    <option>Hospitality</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Apprenticeship</option>
                    <option>Contract</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, State"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pay Type</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Hourly</option>
                    <option>Salary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Pay</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="15.00"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Pay</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="25.00"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                <textarea
                  rows={6}
                  placeholder="Describe the role, responsibilities, and requirements..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">WOTC Eligibility</h2>
            <p className="text-gray-600 mb-4">Select which WOTC-eligible groups this job is open to:</p>
            
            <div className="grid md:grid-cols-2 gap-3">
              {['Veterans', 'SNAP Recipients', 'Long-term Unemployed', 'Ex-Felons', 'TANF Recipients', 'SSI Recipients', 'Vocational Rehabilitation', 'Summer Youth'].map((group) => (
                <label key={group} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{group}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Publishing Options</h2>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                <input type="radio" name="status" defaultChecked className="w-4 h-4 text-brand-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Publish Immediately</p>
                  <p className="text-sm text-gray-500">Job will be visible to candidates right away</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                <input type="radio" name="status" className="w-4 h-4 text-brand-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Save as Draft</p>
                  <p className="text-sm text-gray-500">Review and publish later</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/admin/jobs"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Post Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
