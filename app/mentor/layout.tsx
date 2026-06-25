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

// Only require login - no role restrictions

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/mentor/dashboard');

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
