import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { 
  User, CreditCard, Key, Bell, Shield, FileText, 
  ChevronRight, Settings, LogOut
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Account | Elevate For Humanity',
  description: 'Manage your account settings, billing, and preferences.',
};

const accountSections = [
  {
    title: 'Profile',
    description: 'Update your personal information and photo',
    href: '/account/profile',
    icon: User,
  },
  {
    title: 'Billing & Payments',
    description: 'Manage payment methods and view invoices',
    href: '/account/billing',
    icon: CreditCard,
  },
  {
    title: 'Licenses & Certificates',
    description: 'View and download your earned credentials',
    href: '/account/licenses',
    icon: FileText,
  },
  {
    title: 'Settings',
    description: 'Notification preferences and account settings',
    href: '/account/settings',
    icon: Settings,
  },
  {
    title: 'Security',
    description: 'Password, two-factor authentication, and login history',
    href: '/account/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    description: 'Email and push notification preferences',
    href: '/account/settings/notifications',
    icon: Bell,
  },
];

export default async function AccountPage() {
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

  if (!user) {
    redirect('/login?redirect=/account');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'My Account' }]} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-brand-blue-100 rounded-full flex items-center justify-center">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || 'Profile'} 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-brand-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || 'Welcome'}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Account Sections */}
        <div className="grid gap-4">
          {accountSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-white rounded-xl p-6 shadow-sm border hover:border-brand-blue-300 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
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

        {/* Sign Out */}
        <div className="mt-8 pt-8 border-t">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 text-brand-red-600 hover:text-brand-red-700 font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
