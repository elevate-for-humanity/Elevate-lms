import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type WebsiteOwnerContext = {
  websiteId: string;
  userId: string;
  workspaceId: string;
  tenantId: string;
  organizationId: string;
  workspaceStatus: string;
};

/**
 * Resolve tenant/organization from the website being operated, never from the
 * user's global/default profile tenant. A single user may legitimately manage
 * Elevate plus one or more customer Website Builder workspaces.
 */
export async function resolveWebsiteOwnerContext(
  websiteId: string,
  userId: string,
): Promise<WebsiteOwnerContext | null> {
  const db = await requireAdminClient();
  const { data: site, error: siteError } = await db
    .from('user_websites')
    .select('id,user_id,organization_id')
    .eq('id', websiteId)
    .maybeSingle();
  if (siteError || !site || site.user_id !== userId || !site.organization_id) return null;

  const { data: workspace, error: workspaceError } = await db
    .from('customer_workspaces')
    .select('id,tenant_id,organization_id,status')
    .eq('organization_id', site.organization_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (workspaceError || !workspace?.id || !workspace.tenant_id || !workspace.organization_id) return null;

  const { data: organization } = await db
    .from('organizations')
    .select('id,tenant_id,status')
    .eq('id', workspace.organization_id)
    .maybeSingle();
  if (!organization || organization.tenant_id !== workspace.tenant_id || organization.status === 'archived') return null;

  return {
    websiteId,
    userId,
    workspaceId: workspace.id,
    tenantId: workspace.tenant_id,
    organizationId: workspace.organization_id,
    workspaceStatus: workspace.status || 'unknown',
  };
}
