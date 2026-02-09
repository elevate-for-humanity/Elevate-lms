import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import StudentNav from './StudentNav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Student Portal | Elevate for Humanity',
  description: 'Access your courses, track progress, and earn achievements.',
};

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) { redirect("/login"); }
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/student');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/student/dashboard" className="font-bold text-blue-600">
                Student Portal
              </Link>
              <StudentNav />
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
