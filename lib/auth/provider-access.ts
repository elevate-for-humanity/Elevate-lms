import { redirect } from 'next/navigation';
import { requirePortalAccess, resolvePortalTenantScope } from '@/lib/auth/portal-access';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function requireProviderPortal(requestedTenantId?: string | null) {
  const access = await requirePortalAccess('provider');
  const scope = resolvePortalTenantScope(access, requestedTenantId);
  const supabase = await createClient();

  if (!access.isPlatformAdmin && !scope.tenantId) {
    redirect('/unauthorized?reason=provider-tenant-required');
  }

  return {
    ...access,
    ...scope,
    db: access.isPlatformAdmin ? await requireAdminClient() : supabase,
    supabase,
  };
}
