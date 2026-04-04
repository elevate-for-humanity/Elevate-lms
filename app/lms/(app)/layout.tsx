import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/lms-routes';
import { LmsAppShell } from './LmsAppShell';

export const dynamic = 'force-dynamic';

export default async function LmsAppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  // Preserve the requested path through login so the user lands back here after auth.
  // x-pathname is set by proxy.ts when it runs as middleware.
  // x-url / x-invoke-path are Next.js internal headers (unreliable in App Router).
  // referer is the browser-supplied previous URL — usable as a fallback.
  const headersList = await headers();
  const rawUrl =
    headersList.get('x-pathname') ||
    headersList.get('x-url') ||
    headersList.get('x-invoke-path') ||
    headersList.get('referer') ||
    '';
  let returnPath = '/lms/courses';
  if (rawUrl) {
    try {
      const u = new URL(rawUrl, 'http://localhost');
      returnPath = u.pathname + (u.search || '');
    } catch {
      // malformed — use default
    }
  }
  const loginRedirect = `/login?redirect=${encodeURIComponent(returnPath)}`;

  if (!supabase) {
    redirect(loginRedirect);
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(loginRedirect);
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Server-side role check
  if (profile?.role && !canAccessRoute('/lms', profile.role)) {
    redirect(getUnauthorizedRedirect(profile.role));
  }

  // Onboarding is separate from LMS access — students can use courses without completing onboarding.

  // Serialize user/profile for client component
  const serializedUser = {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };

  return (
    <LmsAppShell user={serializedUser} profile={profile}>
      {children}
    </LmsAppShell>
  );
}
