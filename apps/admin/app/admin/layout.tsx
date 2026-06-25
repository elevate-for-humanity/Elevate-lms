/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * Requires valid session for all admin routes.
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if no valid session
  if (!user) {
    redirect('/login?redirect=/admin');
  }

  // Redirect to unauthorized if user has no profile (not a valid admin user)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Valid admin roles
  const validRoles = ['admin', 'instructor', 'staff', 'super_admin'];
  if (!profile?.role || !validRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
