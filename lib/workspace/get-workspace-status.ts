import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';

export type WorkspaceStatusRecord = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  workspaceUrl: string | null;
  ownerEmail: string | null;
  subscriptionTier: string;
  trialEndsAt: string | null;
  provisionError: string | null;
  createdAt: string;
  provisionedAt: string | null;
};

export async function getWorkspaceStatus(params: {
  workspaceId?: string;
  slug?: string;
}): Promise<WorkspaceStatusRecord | null> {
  const db = await requireAdminClient();
  if (!params.workspaceId && !params.slug) return null;

  let query = db
    .from('customer_workspaces')
    .select(
      'id, slug, display_name, status, workspace_url, owner_email, subscription_tier, trial_ends_at, provision_error, created_at, provisioned_at',
    );

  if (params.workspaceId) {
    query = query.eq('id', params.workspaceId);
  } else if (params.slug) {
    query = query.eq('slug', params.slug);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  return {
    id: data.id as string,
    slug: data.slug as string,
    displayName: data.display_name as string,
    status: data.status as string,
    workspaceUrl: (data.workspace_url as string | null) ?? null,
    ownerEmail: (data.owner_email as string | null) ?? null,
    subscriptionTier: data.subscription_tier as string,
    trialEndsAt: (data.trial_ends_at as string | null) ?? null,
    provisionError: (data.provision_error as string | null) ?? null,
    createdAt: data.created_at as string,
    provisionedAt: (data.provisioned_at as string | null) ?? null,
  };
}
