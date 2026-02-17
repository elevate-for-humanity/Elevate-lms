import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { createClient } from '@/lib/supabase/server';
import { canAccessRoute, getUnauthorizedRedirect } from '@/lib/auth/lms-routes';
import { LmsAppShell } from './LmsAppShell';

export const dynamic = 'force-dynamic';

export default async function LmsAppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();

  if (!supabase) {
    redirect('/login?next=/lms/dashboard');
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?next=/lms/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Server-side role check
  if (profile?.role && !canAccessRoute('/lms', profile.role)) {
    redirect(getUnauthorizedRedirect(profile.role));
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
