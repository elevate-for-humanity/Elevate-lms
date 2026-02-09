import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Calendar, Link as LinkIcon, Tag } from 'lucide-react';
import { createGrantOpportunity } from '../actions';

export const metadata: Metadata = {
  title: 'Add Grant Opportunity | Admin',
  description: 'Add a new grant funding opportunity.',
};

export default function NewGrantPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/grants"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Grants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add Grant Opportunity</h1>
          <p className="text-gray-600 mt-1">Track a new grant funding opportunity</p>
        </div>

        {/* Form */}
        <form action={createGrantOpportunity} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Grant Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grant Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g., Workforce Innovation Grant"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Funder / Organization *
                </label>
                <input
                  type="text"
                  name="funder"
                  required
                  placeholder="e.g., US Department of Labor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Brief description of the grant opportunity..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Funding Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Funding Amount
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Amount ($)
                </label>
                <input
                  type="number"
                  name="amountMin"
                  min="0"
                  step="1000"
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Amount ($)
                </label>
                <input
                  type="number"
                  name="amountMax"
                  min="0"
                  step="1000"
                  placeholder="250000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              Timeline
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Focus Areas */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-400" />
              Focus Areas
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Focus Areas (comma-separated)
              </label>
              <input
                type="text"
                name="focusAreas"
                placeholder="e.g., workforce, healthcare, technology, education"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter keywords separated by commas</p>
            </div>
          </div>

          {/* Application Link */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-gray-400" />
              Application Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application URL
                </label>
                <input
                  type="url"
                  name="applicationUrl"
                  placeholder="https://grants.gov/..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eligibility Requirements
                </label>
                <textarea
                  name="eligibility"
                  rows={4}
                  placeholder="Enter each requirement on a new line:&#10;- Must be a 501(c)(3) organization&#10;- Minimum 2 years of operation&#10;- Located in Indiana"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
            <Link
              href="/admin/grants"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Grant Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
