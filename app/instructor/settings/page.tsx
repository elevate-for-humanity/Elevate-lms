import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Settings, User, Mail, Phone, Bell } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Settings | Instructor Portal',
  description: 'Manage your instructor account settings.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorSettingsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !['instructor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Settings' }]} />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            <Link href="/instructor/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-brand-blue-600" />
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>
          
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={profile.full_name || ''}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Instructor"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
                placeholder="Brief bio for your instructor profile..."
              />
            </div>

            <button type="submit" className="px-6 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              Save Profile
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-brand-orange-600" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">New Enrollments</div>
                <div className="text-sm text-gray-600">Get notified when students enroll in your courses</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">Student Messages</div>
                <div className="text-sm text-gray-600">Get notified when students send you messages</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
            
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
              <div>
                <div className="font-medium">Course Completions</div>
                <div className="text-sm text-gray-600">Get notified when students complete your courses</div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 text-brand-blue-600 rounded" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
