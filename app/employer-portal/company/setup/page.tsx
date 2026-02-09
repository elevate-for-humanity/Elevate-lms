import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import { Building, ArrowLeft, Upload, MapPin, Globe, Phone, Mail, Users, Save } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Company Setup | Employer Portal',
  description: 'Set up your company profile to start hiring.',
  robots: { index: false, follow: false },
};

export default function CompanySetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
            <Breadcrumbs items={[{ label: "Employer Portal", href: "/employer-portal" }, { label: "Company" }]} />
<div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/employer-portal/company" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Company Profile
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Setup</h1>
              <p className="text-gray-600">Complete your company profile to start hiring</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold text-blue-600">75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        <form className="space-y-8">
          {/* Logo & Cover */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Branding</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB (400x400 recommended)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition cursor-pointer">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 10MB (1920x400 recommended)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                <input
                  type="text"
                  defaultValue="ABC Healthcare Services"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Healthcare</option>
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Retail</option>
                    <option>Hospitality</option>
                    <option>Construction</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Size *</label>
                  <select className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>1-10 employees</option>
                    <option>11-50 employees</option>
                    <option>50-200 employees</option>
                    <option>201-500 employees</option>
                    <option>500+ employees</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">About Your Company *</label>
                <textarea
                  rows={4}
                  defaultValue="ABC Healthcare Services is a leading provider of home health and medical staffing solutions."
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">EIN (Tax ID) *</label>
                <input
                  type="text"
                  placeholder="XX-XXXXXXX"
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Required for WOTC tax credit processing</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      placeholder="www.yourcompany.com"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HR Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="hr@yourcompany.com"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    rows={2}
                    placeholder="Street address, City, State ZIP"
                    className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Benefits Offered</h2>
            <p className="text-gray-600 mb-4">Select the benefits your company offers to employees:</p>
            
            <div className="grid md:grid-cols-3 gap-3">
              {[
                'Health Insurance',
                'Dental Insurance',
                'Vision Insurance',
                '401(k) / Retirement',
                'Paid Time Off',
                'Sick Leave',
                'Parental Leave',
                'Life Insurance',
                'Disability Insurance',
                'Tuition Assistance',
                'Training Programs',
                'Flexible Schedule',
                'Remote Work Options',
                'Employee Discounts',
                'Wellness Programs',
              ].map((benefit) => (
                <label key={benefit} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-purple-300">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link
              href="/employer-portal/company"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
