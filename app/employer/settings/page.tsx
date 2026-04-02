import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings, Building2, Mail, Phone, MapPin, Shield, Bell, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Account Settings | Employer Portal',
  description: 'Manage your employer account settings and company profile.',
};

export const dynamic = 'force-dynamic';

export default async function EmployerSettingsPage() {
  const supabase = await createClient();


  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !['employer', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Merge employer record for company-level data
  const { data: employer } = await supabase
    .from('employers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your company profile and preferences</p>
            </div>
            <Link
              href="/employer/dashboard"
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Company Profile */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-lg font-semibold">Company Profile</h2>
          </div>
          
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                defaultValue={employer?.company_name || profile.company_name || ''}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Your Company Name"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                  <option value="">Select Industry</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="construction">Construction</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="technology">Technology</option>
                  <option value="retail">Retail</option>
                  <option value="hospitality">Hospitality</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500">
                  <option value="">Select Size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Description
              </label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Brief description of your company..."
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
            >
              Save Company Profile
            </button>
          </form>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-brand-green-600" />
            <h2 className="text-lg font-semibold">Contact Information</h2>
          </div>
          
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  defaultValue={profile.full_name || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="e.g., HR Manager"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    defaultValue={profile.email || user.email || ''}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    defaultValue={profile.phone || ''}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  rows={2}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                  placeholder="Street address, City, State, ZIP"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 transition"
            >
              Save Contact Info
            </button>
          </form>
        </div>

        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-lg font-semibold">Verification Status</h2>
          </div>
          
          {profile.verified ? (
            <div className="flex items-center gap-3 p-4 bg-brand-green-50 rounded-lg">
              <div className="w-10 h-10 bg-brand-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand-green-600" />
              </div>
              <div>
                <div className="font-semibold text-brand-green-900">Account Verified</div>
                <div className="text-sm text-brand-green-700">
                  You have full access to all employer features.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-yellow-900">Verification Pending</div>
                  <div className="text-sm text-yellow-700">
                    Complete verification to post jobs and contact candidates.
                  </div>
                </div>
              </div>
              <Link
                href="/employer/verification"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Complete Verification
              </Link>
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-brand-orange-600" />
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">New Applications</div>
                <div className="text-sm text-gray-600">Get notified when candidates apply to your jobs</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">New Candidates</div>
                <div className="text-sm text-gray-600">Get notified when new candidates match your criteria</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">Weekly Digest</div>
                <div className="text-sm text-gray-600">Receive a weekly summary of activity</div>
              </div>
              <input type="checkbox" className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
