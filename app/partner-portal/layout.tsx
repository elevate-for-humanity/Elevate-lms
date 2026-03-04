export const dynamic = 'force-dynamic';

import React from 'react';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import PartnerNav from '@/components/partner/PartnerNav';

export const metadata: Metadata = {
  title: {
    default: 'Partner Portal | Elevate for Humanity',
    template: '%s | Elevate Partner',
  },
  description: 'Workforce board and training provider partnership portal.',
  robots: { index: false, follow: false },
};

export default async function PartnerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const db = createAdminClient() || supabase;
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = ['admin', 'super_admin'].includes(profile?.role || '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold text-gray-900">Partner Portal</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 md:grid-cols-[240px_1fr]">
        <PartnerNav isAdmin={isAdmin} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
