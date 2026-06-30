import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import MentorPortalShell from './MentorPortalShell';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: `Mentor Portal | ${PLATFORM_DEFAULTS.orgName}`,
    template: '%s | Mentor Portal',
  },
  description: 'Manage your mentees, schedule sessions, and track mentoring progress.',
};

const ALLOWED_ROLES = ['mentor', 'admin', 'super_admin'];

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/mentor/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return (
    <>
      <IdleTimeoutGuard />
      <MentorPortalShell userName={profile.full_name} userEmail={profile.email ?? user.email}>
        {children}
      </MentorPortalShell>
    </>
  );
}
