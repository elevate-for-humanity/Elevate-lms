import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Settings | Elevate for Humanity',
  description: 'Settings page content.',
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/account/settings');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-brand-blue-700 to-brand-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-blue-200">Workforce development resources.</p>
        </div>
      </section>
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="bg-brand-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-blue-700">Back to Home</Link>
        </div>
      </section>
    </div>
  );
}
