import { SupabaseClient } from '@supabase/supabase-js';

import { logAuditEvent } from '@/lib/audit';

/**
 * Bind a user's profile to an organization
 * Used when creating or joining an org
 */
export async function bindUserToOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: orgId })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to bind user to org`);
  }
}
