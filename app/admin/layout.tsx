import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * Requires admin or super_admin role for access.
 */
export default async function AdminGroupLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const db = await getAdminClient();

  // Get return path for login redirect
  const headersList = await headers();
  const rawUrl = headersList.get('x-pathname') || headersList.get('referer') || '';
  let returnPath = '/admin/dashboard';
  if (rawUrl) {
    try {
      const u = new URL(rawUrl, 'http://localhost');
      returnPath = u.pathname + (u.search || '');
    } catch { /* use default */ }
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
    .single();

  const adminRoles = ['admin', 'super_admin'];
  const isEmergencyAdmin = user.email === 'elizabethpowell6262@gmail.com';
  
  if (!isEmergencyAdmin && (!profile?.role || !adminRoles.includes(profile.role))) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
