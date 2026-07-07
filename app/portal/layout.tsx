import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { allowedRolesForPortalPath } from '@/lib/portal/apprentice-access';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/portal';

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const allowedRoles = allowedRolesForPortalPath(pathname);
  if (!profile?.role || !allowedRoles.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
