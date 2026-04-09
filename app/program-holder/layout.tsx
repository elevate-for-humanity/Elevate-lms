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
  PenTool,
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
  // Dashboard pages will handle their own auth
  if (!user) {
    return <>{children}</>;
  }

  // Get user profile to check role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

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
    { href: '/program-holder/sign-mou', label: 'Sign MOU', icon: PenTool },
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
