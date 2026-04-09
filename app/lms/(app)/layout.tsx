import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/lms-routes';
import { LmsAppShell } from './LmsAppShell';

export const dynamic = 'force-dynamic';

export default async function LmsAppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

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

  // Gate LMS access — students must have admin-granted access before entering the LMS.
  // access_granted_at is set by admin via /admin/enrollments grant-access action.
  if (profile?.role === 'student') {
    const { data: enrollment } = await db
      .from('program_enrollments')
      .select('access_granted_at, onboarding_completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!enrollment?.access_granted_at) {
      // Fallback: HVAC and other legacy students are enrolled via training_enrollments
      // (pre-dates program_enrollments). approved_at serves the same gate role.
      const { data: legacyEnrollment } = await db
        .from('training_enrollments')
        .select('approved_at, status')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const legacyActive =
        !!legacyEnrollment?.approved_at ||
        legacyEnrollment?.status === 'active';

      if (!legacyActive) {
        // Not yet granted — send to student portal with pending state
        redirect('/learner/dashboard?access=pending');
      }
    }
  }

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
