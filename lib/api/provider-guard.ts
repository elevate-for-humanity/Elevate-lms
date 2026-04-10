// Provider API guard: verifies the caller is an active (non-suspended) provider_admin.
// Use this in every provider write route instead of inline role checks.
//
// Returns { profile, tenantId } on success, or { error: NextResponse } to return immediately.

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { safeError } from '@/lib/api/safe-error';
import type { NextResponse } from 'next/server';

type GuardSuccess = {
  error: null;
  userId: string;
  tenantId: string;
};

type GuardFailure = {
  error: NextResponse;
  userId?: never;
  tenantId?: never;
};

export async function providerApiGuard(): Promise<GuardSuccess | GuardFailure> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: safeError('Unauthorized', 401) };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'provider_admin' || !profile.tenant_id) {
    return { error: safeError('Forbidden', 403) };
  }

  // Check tenant is active — never trust the UI suspension check alone
  const db = await getAdminClient();
  if (!db) return { error: safeError('Service unavailable', 503) };

  const { data: tenant } = await db
    .from('tenants')
    .select('status')
    .eq('id', profile.tenant_id)
    .single();

  if (!tenant) return { error: safeError('Tenant not found', 404) };
  if (tenant.status === 'suspended') {
    return { error: safeError('Your provider account is suspended. Contact support@elevateforhumanity.org.', 403) };
  }
  if (!['active'].includes(tenant.status)) {
    return { error: safeError('Provider account is not active', 403) };
  }

  return { error: null, userId: user.id, tenantId: profile.tenant_id };
}
