import 'server-only';


import { requireAdminClient } from '@/lib/supabase/admin';


interface AdminIdentity {
  id: string;
  email?: string | null;
  role?: string | null;
}


export interface ResolvedAdminOrganization {
  organizationId: string;
  userId: string;
  role: string;
}


export async function resolveAdminOrganization(
  auth: AdminIdentity,
  requestedOrganizationId?: string | null,
): Promise<ResolvedAdminOrganization> {
  const db = await requireAdminClient();


  const { data: memberships, error } = await db
    .from('organization_users')
    .select('organization_id, role, status')
    .eq('user_id', auth.id)
    .eq('status', 'active');


  if (error) {
    throw new Error(
      `Unable to resolve organization membership: ${error.message}`,
    );
  }


  const rows = memberships ?? [];


  if (rows.length === 0) {
    throw new Error(
      'The authenticated administrator has no active organization membership.',
    );
  }


  if (requestedOrganizationId) {
    const membership = rows.find(
      (row) => row.organization_id === requestedOrganizationId,
    );


    if (!membership) {
      throw new Error(
        'The requested organization is not available to this administrator.',
      );
    }


    return {
      organizationId: membership.organization_id,
      userId: auth.id,
      role: membership.role ?? 'admin',
    };
  }


  if (rows.length > 1) {
    throw new Error(
      'An organization must be selected because this administrator belongs to multiple organizations.',
    );
  }


  return {
    organizationId: rows[0].organization_id,
    userId: auth.id,
    role: rows[0].role ?? 'admin',
  };
}
