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

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    const headersList = await headers();
    const rawUrl = headersList.get('x-pathname') || '/admin/dashboard';
    let returnPath = '/admin/dashboard';
    try {
      const u = new URL(rawUrl, 'http://localhost');
      returnPath = u.pathname + (u.search || '');
    } catch { /* use default */ }
    
    redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  }

  // Check for admin/staff/instructor role in profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = ['admin', 'super_admin', 'staff', 'instructor', 'host_shop'];
  const isEmergencyAdmin = user.email === 'elizabethpowell6262@gmail.com';
  
  if (!isEmergencyAdmin && (!profile || !profile.role || !allowedRoles.includes(profile.role))) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
