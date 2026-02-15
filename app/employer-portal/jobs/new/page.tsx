import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Briefcase, MapPin, DollarSign, Clock, Users, ArrowLeft, Save, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Post New Job | Employer Portal',
  description: 'Create a new job listing to attract WOTC-eligible candidates.',
  robots: { index: false, follow: false },
};

export default function NewJobPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Jobs" }]} />
<div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/employer-portal/jobs" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-4">
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
        <form className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Barber Apprentice, Medical Assistant"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Select department</option>
                    <option>Operations</option>
                    <option>Healthcare</option>
                    <option>IT</option>
                    <option>Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Apprenticeship</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
                <textarea
                  rows={6}
                  placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
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
                    <input
                      type="text"
                      placeholder="City, State"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remote Options</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
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
                    <input
                      type="text"
                      placeholder="e.g., Mon-Fri 9am-5pm"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Week</label>
                  <input
                    type="number"
                    placeholder="40"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
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
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Hourly</option>
                    <option>Salary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-3">Benefits Offered</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {['Health Insurance', 'Dental Insurance', 'Vision Insurance', '401(k)', 'Paid Time Off', 'Training Provided', 'Tuition Assistance', 'Flexible Schedule', 'Career Growth'].map((benefit) => (
                    <label key={benefit} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-brand-blue-300">
                      <input type="checkbox" className="w-4 h-4 text-brand-blue-600 rounded" />
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
                <textarea
                  rows={4}
                  placeholder="List the must-have qualifications..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Qualifications</label>
                <textarea
                  rows={4}
                  placeholder="List nice-to-have qualifications..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Entry Level (No experience required)</option>
                    <option>1-2 years</option>
                    <option>3-5 years</option>
                    <option>5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
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
              {[
                'Veterans',
                'SNAP Recipients',
                'Long-term Unemployed',
                'Ex-Felons',
                'Vocational Rehabilitation',
                'Summer Youth',
                'TANF Recipients',
                'SSI Recipients',
              ].map((group) => (
                <label key={group} className="flex items-center gap-2 p-3 bg-white border rounded-lg cursor-pointer hover:border-brand-blue-300">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-brand-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{group}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button type="button" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            <div className="flex gap-4">
              <button type="button" className="px-6 py-3 border border-brand-blue-600 text-brand-blue-600 rounded-lg hover:bg-brand-blue-50 transition flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button type="submit" className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold">
                Post Job
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
