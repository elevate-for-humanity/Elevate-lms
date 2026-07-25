/**
 * Admin group layout - applies authentication to all /admin/* pages.
 * Requires valid session for all admin routes.
 * Excludes /login routes to avoid infinite redirect loop.
 */
import { createClient, safeGetUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import BuildVersionSync from '@/components/BuildVersionSync';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bypass auth check for login/unauthorized routes
  const headersList = await headers();
  const pathname = headersList.get('x-nextjs-pathname') || '';
  const isAuthRoute = pathname.startsWith('/login') || pathname === '/unauthorized';
  if (isAuthRoute) {
    return (
      <>
        <BuildVersionSync />
        {children}
        <LiveChatWidget />
      </>
    );
  }

  const supabase = await createClient();
  const user = safeGetUser(await supabase.auth.getUser());

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

  return (
    <>
      <BuildVersionSync />
      {children}
      <LiveChatWidget />
    </>
  );
}
