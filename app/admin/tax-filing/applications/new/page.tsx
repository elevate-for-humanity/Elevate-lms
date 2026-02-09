import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { ArrowLeft, FileText, User, DollarSign, Calendar, Save, Upload } from 'lucide-react';

export const metadata: Metadata = {
  title: 'New Tax Filing Application | Admin',
  description: 'Create a new tax filing assistance application.',
  robots: { index: false, follow: false },
};

export default function NewTaxFilingApplicationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "New" }]} />
      </div>
<div className="max-w-3xl mx-auto">
        <Link href="/admin/tax-filing" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Tax Filing
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Tax Filing Application</h1>
            <p className="text-gray-600">Create a VITA tax filing assistance request</p>
          </div>
        </div>

        <form className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Client Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tax Year *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filing Status *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Single</option>
                    <option>Married Filing Jointly</option>
                    <option>Married Filing Separately</option>
                    <option>Head of Household</option>
                    <option>Qualifying Widow(er)</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Income</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Dependents</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Income Sources</h2>
            
            <div className="space-y-4">
              {['W-2 Employment', '1099 Self-Employment', 'Unemployment Benefits', 'Social Security', 'Other Income'].map((source) => (
                <label key={source} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-purple-300">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-gray-700">{source}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Documents</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">W-2s, 1099s, ID, and other tax documents</p>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              <p className="font-medium mb-2">Required Documents:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Government-issued ID</li>
                <li>Social Security cards for all family members</li>
                <li>All W-2 and 1099 forms</li>
                <li>Prior year tax return (if available)</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Appointment</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time</label>
                <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Morning (9am - 12pm)</option>
                  <option>Afternoon (12pm - 5pm)</option>
                  <option>Evening (5pm - 8pm)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              href="/admin/tax-filing"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
