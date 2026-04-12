import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate for Humanity',
  description: 'Manage your training programs, students, and compliance.',
  manifest: '/manifest-program-holder.json',
};

import {
  Shield,
  Users,
  FileText,
  Book,
  LifeBuoy,
  LayoutDashboard,
  Bell,
  Megaphone,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Clock,
  HelpCircle,
} from 'lucide-react';

export default async function ProgramHolderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, just render children (for public landing page)
  if (!user) {
    return <>{children}</>;
  }

  // Check approval status — block access to all portal pages until admin approves
  const { data: profile } = await db
    .from('profiles')
    .select('role, program_holder_id')
    .eq('id', user.id)
    .maybeSingle();

  // Allow admins and staff through unconditionally
  const isAdmin = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  if (!isAdmin && profile?.program_holder_id) {
    const { data: holder } = await db
      .from('program_holders')
      .select('status, approved_at')
      .eq('id', profile.program_holder_id)
      .maybeSingle();

    const isPending = !holder || !['approved', 'active'].includes(holder?.status ?? '') || !holder?.approved_at;

    if (isPending) {
      // Only allow onboarding pages while pending — block everything else
      // Children will be the pending approval page rendered below
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm max-w-md w-full p-8 text-center">
            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Thank You for Your Submission</h1>
            <p className="text-gray-600 text-sm mb-4">
              We have received your application and our team is currently reviewing your information. Once your account has been approved, you will receive an email with your next steps and access to your program holder portal.
            </p>
            <p className="text-gray-500 text-xs mb-6">
              Questions? Contact us at{' '}
              <a href="mailto:elevate4humanityedu@gmail.com" className="text-blue-600 underline">
                elevate4humanityedu@gmail.com
              </a>
            </p>
            <a
              href="/logout"
              className="inline-block text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Sign out
            </a>
          </div>
        </div>
      );
    }
  }

  // If not a program holder, just render children (for public landing page)
  if (!profile || profile.role !== 'program_holder') {
    return <>{children}</>;
  }

  const navItems = [
    { href: '/program-holder/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/program-holder/verification', label: 'Verification', icon: Shield },
    { href: '/program-holder/students', label: 'Students', icon: Users },
    { href: '/program-holder/students/pending', label: 'Pending Students', icon: Clock },
    { href: '/program-holder/students/at-risk', label: 'At-Risk Students', icon: AlertTriangle },
    { href: '/program-holder/grades', label: 'Grades', icon: GraduationCap },
    { href: '/program-holder/courses/create', label: 'Create Course', icon: BookOpen },
    { href: '/program-holder/campaigns', label: 'Campaigns', icon: Megaphone },
    { href: '/program-holder/notifications', label: 'Notifications', icon: Bell },
    { href: '/program-holder/mou', label: 'MOU', icon: FileText },
    { href: '/program-holder/how-to-use', label: 'How to Use', icon: HelpCircle },
    { href: '/program-holder/reports', label: 'Reports', icon: FileText },
    { href: '/program-holder/compliance', label: 'Compliance', icon: Shield },
    { href: '/program-holder/documentation', label: 'Documentation', icon: Book },
    { href: '/program-holder/support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <nav role="navigation" aria-label="Main navigation" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link
                  href="/program-holder/dashboard"
                  className="text-xl font-bold text-brand-orange-600"
                >
                  Program Holder Portal
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item: any) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-black hover:text-black hover:border-gray-300"
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center">
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm font-medium text-black hover:text-black"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item: any) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-black hover:text-black hover:bg-white hover:border-gray-300"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}
