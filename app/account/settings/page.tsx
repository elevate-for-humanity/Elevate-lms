import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  Bell, Shield, Globe, Moon, Trash2, ChevronRight, 
  Mail, Smartphone, Eye, Lock
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account Settings | Elevate For Humanity',
  description: 'Manage your account preferences, notifications, and security settings.',
};

const settingsSections = [
  {
    title: 'Notifications',
    description: 'Email, SMS, and push notification preferences',
    href: '/account/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Security',
    description: 'Password, two-factor authentication, sessions',
    href: '/account/settings/security',
    icon: Shield,
  },
  {
    title: 'Privacy',
    description: 'Profile visibility and data sharing preferences',
    href: '/account/settings/privacy',
    icon: Eye,
  },
  {
    title: 'Language & Region',
    description: 'Language, timezone, and date format',
    href: '/account/settings/language',
    icon: Globe,
  },
  {
    title: 'Appearance',
    description: 'Theme and display preferences',
    href: '/account/settings/appearance',
    icon: Moon,
  },
];

export default async function AccountSettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/settings');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Account', href: '/account' },
            { label: 'Settings' }
          ]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

        {/* Settings Sections */}
        <div className="space-y-4 mb-12">
          {settingsSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-brand-blue-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <section.icon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
                <p className="text-gray-600 text-sm">{section.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Quick Settings */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <h2 className="font-semibold text-gray-900 mb-6">Quick Settings</h2>
          
          <div className="space-y-6">
            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Email Notifications</div>
                  <div className="text-sm text-gray-600">Receive updates via email</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
              </label>
            </div>

            {/* SMS Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">SMS Notifications</div>
                  <div className="text-sm text-gray-600">Receive text message alerts</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white"></div>
              </label>
            </div>

            {/* Two-Factor Auth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">Add an extra layer of security</div>
                </div>
              </div>
              <Link 
                href="/account/settings/security"
                className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium"
              >
                Set Up
              </Link>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-red-200">
          <h2 className="font-semibold text-brand-red-600 mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            className="px-4 py-2 border border-brand-red-300 text-brand-red-600 rounded-lg hover:bg-brand-red-50 transition-colors text-sm font-medium"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
