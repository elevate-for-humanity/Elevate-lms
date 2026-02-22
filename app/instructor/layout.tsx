import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, Users, BarChart, Settings, Home, MessageSquare } from 'lucide-react';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Instructor Portal | Elevate for Humanity',
  description: 'Manage your courses, students, and teaching materials.',
  manifest: '/manifest-instructor.json',
};

const navItems = [
  { href: '/instructor', icon: Home, label: 'Dashboard' },
  { href: '/instructor/courses', icon: BookOpen, label: 'Courses' },
  { href: '/instructor/students', icon: Users, label: 'Students' },
  { href: '/instructor/analytics', icon: BarChart, label: 'Analytics' },
  { href: '/instructor/campaigns', icon: MessageSquare, label: 'Campaigns' },
  { href: '/instructor/settings', icon: Settings, label: 'Settings' },
];

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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
    redirect('/login?redirect=/instructor');
  }

  // Verify user has instructor role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Allow admin or instructor roles
  if (profile?.role !== 'instructor' && profile?.role !== 'admin') {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <IdleTimeoutGuard />
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/instructor" className="font-bold text-brand-blue-600">
                Instructor Portal
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded-lg transition"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
