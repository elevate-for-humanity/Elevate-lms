// lib/auth/syncUserProfile.ts
// Sync SSO users into Supabase profiles table
//
// SECURITY: tenant_id is immutable after initial insert.
// The DB enforces this via RLS policy + trigger, but we also
// enforce it here to prevent accidental field creep.
// Do NOT add tenant_id to the update payload.

import { requireAdminClient } from '@/lib/supabase/admin';

import { setAuditContext } from '@/lib/audit-context';

async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return requireAdminClient();
}

type SyncUserInput = {
  email: string;
  name: string;
  provider: string;
  providerAccountId: string;
  tenantId?: string;
};

export async function syncUserProfile(input: SyncUserInput) {
  const { email, name, provider, providerAccountId, tenantId } = input;

  if (!email) return;

  const supabase = await getSupabaseAdmin();

  await setAuditContext(supabase, { systemActor: 'sso_profile_sync' });

  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('profiles')
      .update({
        full_name: name,
        last_login_at: new Date().toISOString(),
        last_login_provider: provider,
        last_login_provider_account_id: providerAccountId,
        updated_at: new Date().toISOString(),
      })
      .eq('email', email);
  } else {
    await supabase.from('profiles').insert({
      email,
      full_name: name,
      tenant_id: tenantId || null,
      last_login_at: new Date().toISOString(),
      last_login_provider: provider,
      last_login_provider_account_id: providerAccountId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}
