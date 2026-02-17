import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Key, Smartphone, History } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Security Settings | Elevate For Humanity',
  description: 'Manage your account security settings.',
};

export default async function SecuritySettingsPage() {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login?redirect=/account/settings/security');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs items={[
            { label: 'Account', href: '/account' },
            { label: 'Settings', href: '/account/settings' },
            { label: 'Security' }
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Security Settings</h1>

        <div className="space-y-6">
          {/* Password */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-blue-100 rounded-lg">
                <Key className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Password</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Change your password to keep your account secure.
                </p>
                <button className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-green-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-brand-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Add an extra layer of security to your account.
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Not Enabled
                  </span>
                  <button className="px-4 py-2 bg-brand-green-600 text-white rounded-lg hover:bg-brand-green-700 transition">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-brand-blue-100 rounded-lg">
                <History className="w-6 h-6 text-brand-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Manage devices where you're currently logged in.
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Current Session</p>
                      <p className="text-sm text-gray-500">This device</p>
                    </div>
                    <span className="px-3 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-sm">
                      Active
                    </span>
                  </div>
                </div>
                <button className="mt-4 px-4 py-2 text-brand-red-600 hover:text-brand-red-700 transition">
                  Sign Out All Other Sessions
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/account/settings" className="text-brand-blue-600 hover:text-brand-blue-700">
            ← Back to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
