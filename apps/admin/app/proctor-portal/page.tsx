import { requireRole } from '@/lib/auth/require-role';
import { TESTING_CENTER_ROLES } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import PageClient from './PageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata = {
  title: 'Proctor Portal | Elevate Admin',
  robots: { index: false, follow: false },
};

export default async function Page() {
  await requireRole(TESTING_CENTER_ROLES);
  const db = await requireAdminClient();
  const { data: programs, error } = await db
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  if (error) throw new Error(`PROCTOR_PROGRAMS_LOAD_FAILED:${error.message}`);
  return <PageClient programs={programs ?? []} />;
}
