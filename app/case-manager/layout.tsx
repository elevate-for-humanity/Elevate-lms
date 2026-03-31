import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Case Manager Portal | Elevate for Humanity',
    template: '%s | Case Manager Portal',
  },
  description: 'Manage participant cases, track progress, and report outcomes.',
};

const ALLOWED_ROLES = ['case_manager', 'admin', 'super_admin', 'staff'];

const NAV_ITEMS = [
  { href: '/case-manager/dashboard',    label: 'Dashboard' },
  { href: '/case-manager/participants', label: 'Participants' },
  { href: '/case-manager/placements',   label: 'Placements' },
  { href: '/case-manager/reports',      label: 'Reports' },
];

export default async function CaseManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/case-manager/dashboard');
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
              <span className="text-lg font-bold text-brand-blue-700">Case Manager Portal</span>
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
