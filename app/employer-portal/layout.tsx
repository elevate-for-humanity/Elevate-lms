export const dynamic = 'force-dynamic';

import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Briefcase, FileText, Users, BarChart3,
  MessageSquare, BookOpen, Settings, Building2, TrendingUp,
} from 'lucide-react';
import EmployerNav from './EmployerNav';

export const metadata: Metadata = {
  title: {
    default: 'Employer Portal | Elevate for Humanity',
    template: '%s | Elevate Hire',
  },
  description: 'Hire skilled graduates and access workforce solutions.',
  robots: { index: false, follow: false },
};

export default async function EmployerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer-portal');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link href="/employer-portal" className="font-semibold text-gray-900">Employer Portal</Link>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <EmployerNav />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
