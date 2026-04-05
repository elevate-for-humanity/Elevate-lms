import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Mentor Portal | Elevate for Humanity',
    template: '%s | Mentor Portal',
  },
  description: 'Manage your mentees, schedule sessions, and track mentoring progress.',
};

const ALLOWED_ROLES = ['mentor', 'admin', 'super_admin'];

const NAV_ITEMS = [
  { href: '/mentor/dashboard', label: 'Dashboard' },
  { href: '/mentor/mentees',   label: 'Mentees' },
  { href: '/mentor/approvals', label: 'Approvals' },
  { href: '/mentor/sessions',  label: 'Sessions' },
  { href: '/mentor/messages',  label: 'Messages' },
  { href: '/mentor/resources', label: 'Resources' },
];

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/mentor/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return (
    <>
      <IdleTimeoutGuard />
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-brand-blue-700">Mentor Portal</span>
              <div className="hidden md:flex items-center gap-4">
                {NAV_ITEMS.map((item) => (
                  <a key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-brand-blue-700 transition-colors">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <a href="/api/auth/signout" className="text-sm text-gray-500 hover:text-gray-700">Sign out</a>
            </div>
          </div>
        </div>
      </nav>
      <div id="main-content">{children}</div>
    </>
  );
}
