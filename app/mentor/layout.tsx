import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
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
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/mentor';
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || profile.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      }}
      role="staff" // Mentor uses staff nav for now
      breadcrumbs={breadcrumbs}
    >
      <IdleTimeoutGuard />
      {children}
    </PlatformShell>
  );
}
