import { SupabaseClient } from '@supabase/supabase-js';

import { logAuditEvent } from '@/lib/audit';

/**
 * Switch user's active organization
 * Only for super_admin or users with multiple org memberships
 */
export async function switchOrg(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): Promise<void> {
  // Verify user has access to this org
  const { data: membership, error: membershipError } = await supabase
    .from('organization_users')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single();

  if (membershipError || !membership) {
    throw new Error('User does not have access to this organization');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ organization_id: orgId })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to switch org`);
  }
}
