export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, User, Building, FileText, Calendar } from 'lucide-react';
import { createWOTCApplication } from '../actions';

import { createClient } from '@/lib/supabase/server';
export const metadata: Metadata = {
  title: 'New WOTC Application | Admin',
  description: 'Submit a new Work Opportunity Tax Credit application.',
};

export default async function NewWOTCPage() {
  const supabase = await createClient();
  const { data: dbRows } = await supabase.from('wotc_applications').select('*').limit(50);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/wotc"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to WOTC Applications
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New WOTC Application</h1>
          <p className="text-gray-600 mt-1">Submit a Work Opportunity Tax Credit application</p>
        </div>

        {/* Info Banner */}
        <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-brand-blue-800">About WOTC</h3>
          <p className="text-sm text-brand-blue-700 mt-1">
            The Work Opportunity Tax Credit (WOTC) is a federal tax credit available to employers 
            who hire individuals from certain target groups who face barriers to employment.
          </p>
        </div>

        {/* Form */}
        <form action={createWOTCApplication} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Employee Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              Employee Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Social Security Number *
                </label>
                <input
                  type="text"
                  name="ssn"
                  required
                  placeholder="XXX-XX-XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dob"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Employer Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-gray-400" />
              Employer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employer Name *
                </label>
                <input
                  type="text"
                  name="employerName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  EIN (Employer ID Number) *
                </label>
                <input
                  type="text"
                  name="ein"
                  required
                  placeholder="XX-XXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="employerPhone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                  placeholder="(317) 314-3757"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Employment Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Offer Date *
                </label>
                <input
                  type="date"
                  name="offerDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Wage ($/hour) *
                </label>
                <input
                  type="number"
                  name="wage"
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position/Job Title *
                </label>
                <input
                  type="text"
                  name="position"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Target Group */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              WOTC Target Group
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select all target groups that apply to this employee:
            </p>
            <div className="space-y-3">
              {[
                { id: 'tanf', label: 'TANF (Temporary Assistance for Needy Families) Recipient' },
                { id: 'veteran', label: 'Qualified Veteran' },
                { id: 'exfelon', label: 'Ex-Felon' },
                { id: 'drc', label: 'Designated Community Resident (Empowerment Zone)' },
                { id: 'vocrehab', label: 'Vocational Rehabilitation Referral' },
                { id: 'summeryouth', label: 'Summer Youth Employee' },
                { id: 'snap', label: 'SNAP (Food Stamp) Recipient' },
                { id: 'ssi', label: 'SSI Recipient' },
                { id: 'longterm', label: 'Long-Term Unemployment Recipient' },
              ].map((group) => (
                <label key={group.id} className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    name="targetGroups" 
                    value={group.id}
                    className="mt-1 rounded border-gray-300" 
                  />
                  <span className="text-sm text-gray-700">{group.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Documentation */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documentation</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input type="file" name="documents" multiple className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-gray-500">
                  <p className="font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm mt-1">PDF, DOC, or image files (max 10MB each)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Certification */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3">
              <input 
                type="checkbox" 
                name="certification" 
                required
                className="mt-1 rounded border-gray-300" 
              />
              <span className="text-sm text-gray-700">
                I certify that the information provided is accurate and complete to the best of my knowledge. 
                I understand that providing false information may result in denial of the tax credit and 
                potential penalties.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/wotc"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              name="saveAsDraft"
              value="true"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition-colors"
            >
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
