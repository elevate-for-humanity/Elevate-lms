export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Building2, Users, FileText, BarChart3, Settings, HelpCircle } from 'lucide-react';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners/portal' },
  title: 'Partner Portal | Elevate For Humanity',
  description: 'Access your partner dashboard to manage referrals, track student progress, and view reports.',
};

const PORTAL_LINKS = [
  { title: 'Student Referrals', desc: 'Submit and track student referrals to training programs.', href: '/partner', icon: Users },
  { title: 'Reports & Analytics', desc: 'View enrollment, completion, and outcome reports.', href: '/partner/reports', icon: BarChart3 },
  { title: 'Documents', desc: 'Access MOUs, agreements, and compliance documents.', href: '/partner/documents', icon: FileText },
  { title: 'Organization Profile', desc: 'Update your organization details and contact information.', href: '/partner/settings', icon: Building2 },
  { title: 'Account Settings', desc: 'Manage your login credentials and notification preferences.', href: '/account/settings', icon: Settings },
  { title: 'Support', desc: 'Contact our partner success team for assistance.', href: '/support', icon: HelpCircle },
];

export default async function PartnerPortalPage() {
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
  if (!user) redirect('/login?next=/partners/portal');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, role, organization')
    .eq('id', user.id)
    .single();

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ''}`.trim()
    : user.email;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[250px] md:h-[300px] flex items-center text-white overflow-hidden">
        <Image
          src="/images/heroes-hq/employer-hero.jpg"
          alt="Partner Portal"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 w-full">
          <p className="text-brand-blue-200 text-sm font-medium mb-1">Partner Portal</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome, {displayName}</h1>
          {profile?.organization && (
            <p className="text-gray-200 text-lg">{profile.organization}</p>
          )}
        </div>
      </section>

      {/* Portal Links */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTAL_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md hover:border-brand-blue-300 transition-all group"
                >
                  <Icon className="w-8 h-8 text-brand-blue-600 mb-4 group-hover:text-brand-blue-700" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-gray-600 text-sm">{link.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/partner"
              className="bg-brand-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-700 transition"
            >
              Go to Dashboard
            </Link>
            <Link
              href="/contact"
              className="bg-white text-brand-blue-600 border border-brand-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-50 transition"
            >
              Contact Partner Success
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
