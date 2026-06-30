import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: `Case Manager Portal | ${PLATFORM_DEFAULTS.orgName}`,
    template: '%s | Case Manager Portal',
  },
  description: 'Manage participant cases, track progress, and report outcomes.',
};

const ALLOWED_ROLES = ['case_manager', 'admin', 'super_admin', 'staff'];

export default async function CaseManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/case-manager/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/case-manager';
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
      role="case_manager"
      breadcrumbs={breadcrumbs}
    >
      <IdleTimeoutGuard />
      {children}
    </PlatformShell>
  );
}
