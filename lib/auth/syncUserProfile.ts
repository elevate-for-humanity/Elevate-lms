// lib/auth/syncUserProfile.ts
// Sync SSO users into Supabase profiles table
//
// SECURITY: tenant_id is immutable after initial insert.
// The DB enforces this via RLS policy + trigger, but we also
// enforce it here to prevent accidental field creep.
// Do NOT add tenant_id to the update payload.

import { createClient } from '@supabase/supabase-js';

import { logAuditEvent } from '@/lib/audit';
import { setAuditContext } from '@/lib/audit-context';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

type SyncUserInput = {
  email: string;
  name: string;
  provider: string;
  providerAccountId: string;
  tenantId?: string;
};

// SECURITY: Allowlist of fields that can be updated on existing profiles.
// tenant_id is intentionally excluded - it can only be set on INSERT.
const ALLOWED_UPDATE_FIELDS = [
  'full_name',
  'last_login_at',
  'last_login_provider',
  'last_login_provider_account_id',
  'updated_at',
] as const;

export async function syncUserProfile(input: SyncUserInput) {
  const { email, name, provider, providerAccountId, tenantId } = input;

  if (!email) return;

  const supabase = getSupabaseAdmin();

  // Set audit context so DB triggers attribute this service-role write
  await setAuditContext(supabase, { systemActor: 'sso_profile_sync' });

  // Check if user exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    // SECURITY: Strict allowlist update - tenant_id is never updated
    const updatePayload = {
      full_name: name,
      last_login_at: new Date().toISOString(),
      last_login_provider: provider,
      last_login_provider_account_id: providerAccountId,
      updated_at: new Date().toISOString(),
    };

    await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('email', email);
  } else {
    // New user: tenant_id is set ONLY on initial insert
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
