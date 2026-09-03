import { requirePortalAccess } from '@/lib/auth/portal-access';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function requireCaseManagerPortal() {
  const access = await requirePortalAccess('casemanager');
  const supabase = await createClient();
  const oversight = access.isPlatformAdmin || access.effectiveRoles.includes('staff');
  return {
    ...access,
    oversight,
    db: oversight ? await requireAdminClient() : supabase,
    supabase,
  };
}
