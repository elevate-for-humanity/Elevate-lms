import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/lms-routes';
import { LmsAppShell } from './LmsAppShell';

export const dynamic = 'force-dynamic';

export default async function LmsAppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?next=/lms/dashboard');
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?next=/lms/dashboard');
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

  // Onboarding gate: students must complete onboarding before accessing LMS
  // Admins and staff bypass this check
  if (
    profile?.role === 'student' &&
    profile?.onboarding_completed !== true
  ) {
    redirect('/onboarding/learner');
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
