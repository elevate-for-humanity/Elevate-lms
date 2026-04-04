import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';


export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Staff Portal | Elevate for Humanity',
    template: '%s | Staff Portal',
  },
  description: 'Manage students, track enrollments, and access administrative tools.',
};

const ALLOWED_ROLES = ['staff', 'admin', 'super_admin', 'advisor'];

export default async function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth check — unauthenticated users see the page without staff chrome.
  // proxy.ts handles redirect for protected sub-routes; this layout adds
  // defense-in-depth by verifying role for authenticated users.
  const supabase = await createClient();
  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — render children (landing page is public, sub-pages
    // are protected by proxy.ts which redirects to /login)
    return <>{children}</>;
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  const staffNavItems = [
    { href: '/staff-portal/dashboard', label: 'Dashboard' },
    { href: '/staff-portal/students', label: 'Students' },
    { href: '/staff-portal/cases', label: 'Cases' },
    { href: '/staff-portal/attendance/record', label: 'Attendance' },
    { href: '/staff-portal/reports', label: 'Reports' },
  ];

  return (
    <>
      <IdleTimeoutGuard />
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-brand-blue-700">Staff Portal</span>
              <div className="hidden md:flex items-center gap-4">
                {staffNavItems.map((item) => (
                  <a key={item.href} href={item.href} className="text-sm text-gray-600 hover:text-brand-blue-700">{item.label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div id="main-content">{children}</div>
    </>
  );
}
