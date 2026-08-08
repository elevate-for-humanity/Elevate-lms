import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveDashboardUrl } from '@/lib/routing/dashboard-resolver';
import { resolveStudentHomePath } from '@/lib/portal/resolve-student-home';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, portal_type')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/unauthorized');

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name)')
    .eq('user_id', user.id);

  const secondaryRoles = (roleRows ?? [])
    .map((row) => (row as { roles?: { name?: unknown } | null }).roles?.name)
    .filter((role): role is string => typeof role === 'string');
  const effectiveRoles = Array.from(new Set([profile.role, ...secondaryRoles].filter(Boolean))) as string[];

  if (effectiveRoles.some((role) => ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'].includes(role))) {
    const destination = await resolveStudentHomePath(supabase, user.id, profile.portal_type);
    redirect(destination);
  }

  redirect(resolveDashboardUrl(profile.role, effectiveRoles));
}
