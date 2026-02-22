import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Bell, 
  Lock, 
  Globe,
  Palette,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  Camera,
  Mail,
  Phone
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings | Student Portal',
  description: 'Manage your account settings, notifications, and preferences.',
};

export const dynamic = 'force-dynamic';

const SETTINGS_SECTIONS = [
  {
    title: 'Profile',
    description: 'Update your personal information and profile picture',
    icon: User,
    href: '/lms/settings/profile',
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
  {
    title: 'Notifications',
    description: 'Manage email and push notification preferences',
    icon: Bell,
    href: '/lms/settings/notifications',
    color: 'bg-brand-orange-100 text-brand-orange-600',
  },
  {
    title: 'Security',
    description: 'Change password and manage two-factor authentication',
    icon: Lock,
    href: '/lms/settings/security',
    color: 'bg-brand-red-100 text-brand-red-600',
  },
  {
    title: 'Privacy',
    description: 'Control your data and privacy settings',
    icon: Shield,
    href: '/lms/settings/privacy',
    color: 'bg-brand-green-100 text-brand-green-600',
  },
  {
    title: 'Language & Region',
    description: 'Set your preferred language and timezone',
    icon: Globe,
    href: '/lms/settings/language',
    color: 'bg-brand-blue-100 text-brand-blue-600',
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    icon: Palette,
    href: '/lms/settings/appearance',
    color: 'bg-pink-100 text-pink-600',
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Settings" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  let profile: any = null;

  try {
    const { data: profileData } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileData) {
      profile = profileData;
    }
  } catch (error) {
    // Table may not exist
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "LMS", href: "/lms/dashboard" }, { label: "Settings" }]} />
        </div>
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 bg-brand-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-brand-blue-600 text-white rounded-full flex items-center justify-center hover:bg-brand-blue-700 transition">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900">
                {profile?.full_name || 'Student'}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone}
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/lms/settings/profile"
              className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-medium hover:bg-brand-blue-700 transition"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {SETTINGS_SECTIONS.map((section) => {
            const IconComponent = section.icon;
            return (
              <Link
                key={section.title}
                href={section.href}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-blue-300 hover:shadow-md transition group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${section.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-blue-600 transition">
                      {section.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">Account</h2>
          </div>
          <div className="divide-y divide-slate-200">
            <Link
              href="/lms/settings/billing"
              className="flex items-center justify-between p-6 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Billing & Payments</h3>
                  <p className="text-sm text-slate-600">Manage payment methods and view invoices</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/lms/settings/data"
              className="flex items-center justify-between p-6 hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Data & Privacy</h3>
                  <p className="text-sm text-slate-600">Download your data or delete your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center justify-between p-6 hover:bg-brand-red-50 transition w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-brand-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-red-600">Sign Out</h3>
                    <p className="text-sm text-slate-600">Sign out of your account on this device</p>
                  </div>
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Help */}
        <div className="mt-8 text-center">
          <p className="text-slate-600">
            Need help? Visit our{' '}
            <Link href="/lms/support" className="text-brand-blue-600 font-medium hover:text-brand-blue-700">
              Support Center
            </Link>
            {' '}or{' '}
            <Link href="/contact" className="text-brand-blue-600 font-medium hover:text-brand-blue-700">
              Contact Us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
