import type { SupabaseClient } from '@supabase/supabase-js';

/** Authenticated callers supply the actor returned by auth.getUser().
 * Hosted-site administration requires both a server-owned platform role and
 * active administrator membership in this exact website's organization.
 * A purchase, editable JWT metadata, or membership in another business grants nothing.
 */
export async function canManageHostedWebsite(db: SupabaseClient<any>, websiteId: string, actorId: string): Promise<boolean> {
  const { data: site, error } = await db.from('user_websites').select('user_id,organization_id').eq('id', websiteId).maybeSingle();
  if (error || !site) return false;
  if (site.user_id === actorId) return true;
  if (!site.organization_id) return false;
  const { data: profile, error: profileError } = await db.from('profiles').select('role').eq('id', actorId).maybeSingle();
  if (profileError || !['admin', 'super_admin'].includes(profile?.role || '')) return false;
  const { data: membership, error: membershipError } = await db.from('organization_users').select('role,status')
    .eq('organization_id', site.organization_id).eq('user_id', actorId).maybeSingle();
  return !membershipError && membership?.status === 'active' && ['org_admin', 'org_owner'].includes(membership.role);
}
