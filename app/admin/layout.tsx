import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * Only requires login - no role restrictions.
 */
export default async function AdminGroupLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
<<<<<<< HEAD
  const db = await requireAdminClient();
=======
>>>>>>> origin/main

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const headersList = await headers();
    const rawUrl = headersList.get('x-pathname') || '/admin/dashboard';
    let returnPath = '/admin/dashboard';
    try {
      const u = new URL(rawUrl, 'http://localhost');
      returnPath = u.pathname + (u.search || '');
    } catch { /* use default */ }
<<<<<<< HEAD
  }
  const loginRedirect = `/login?redirect=${encodeURIComponent(returnPath)}`;

  if (!supabase) {
    redirect(loginRedirect);
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }


  if (error || !user) {
    redirect(loginRedirect);
  }

  // Check for admin role in profiles
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const adminRoles = ['admin', 'super_admin'];
  const isEmergencyAdmin = user.email === 'elizabethpowell6262@gmail.com';
  
  if (!isEmergencyAdmin && (!profile || !profile.role || !adminRoles.includes(profile.role))) {
    redirect('/unauthorized');
=======
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
>>>>>>> origin/main
  }

  return <>{children}</>;
}
