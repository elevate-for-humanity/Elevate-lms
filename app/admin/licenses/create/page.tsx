import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, Award, Calendar, User, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create License | Admin',
  description: 'Issue a new professional license.',
  robots: { index: false, follow: false },
};

export default function CreateLicensePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Create" }]} />
      </div>
<div className="max-w-3xl mx-auto">
        <Link href="/admin/licenses" className="flex items-center gap-2 text-gray-600 hover:text-brand-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Licenses
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-brand-blue-100 rounded-xl flex items-center justify-center">
            <Award className="w-6 h-6 text-brand-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Issue New License</h1>
            <p className="text-gray-600">Create a professional license for a participant</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">License Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Type *</label>
                <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                  <option>Select license type</option>
                  <option>Barber License</option>
                  <option>Cosmetology License</option>
                  <option>Medical Assistant Certification</option>
                  <option>Phlebotomy Certification</option>
                  <option>OSHA Safety Certification</option>
                  <option>Food Handler Certification</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                  <input
                    type="text"
                    placeholder="e.g., BL-2025-001234"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Authority *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Indiana State Board</option>
                    <option>National Certification Board</option>
                    <option>OSHA</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issue Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiration Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Recipient Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Participant *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Program Completed</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent">
                    <option>Barber Apprenticeship Program</option>
                    <option>Medical Assistant Training</option>
                    <option>IT Support Certification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Additional Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional notes about this license..."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="notify" className="w-4 h-4 text-brand-blue-600 rounded" defaultChecked />
                <label htmlFor="notify" className="text-sm text-gray-700">
                  Send notification email to recipient
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/admin/licenses"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Issue License
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
