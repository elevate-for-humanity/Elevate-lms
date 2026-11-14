import { requireAdminClient } from '@/lib/supabase/admin';

export type UserRole = 'sponsor' | 'employer' | 'workone' | 'admin';

async function resolveRoleId(role: UserRole): Promise<string | null> {
  const supabase = await requireAdminClient();
  const { data, error }: any = await supabase
    .from('roles')
    .select('id')
    .eq('name', role)
    .maybeSingle();

  if (error || !data?.id) return null;
  return data.id as string;
}

export async function requireRole(userId: string, role: UserRole) {
  const supabase = await requireAdminClient();
  const roleId = await resolveRoleId(role);

  if (roleId) {
    const { data, error }: any = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .maybeSingle();

    if (!error && data) return data;
  }

  // Transitional fallback for any pre-relational records that still carry the
  // retired text role column. Production assignments use role_id.
  const { data: legacyData, error: legacyError }: any = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();

  if (legacyError || !legacyData) {
    throw new Error('Unauthorized: Required role not found');
  }

  return legacyData;
}

export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    await requireRole(userId, role);
    return true;
  } catch {
    return false;
  }
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await requireAdminClient();

  const { data: assignments, error }: any = await supabase
    .from('user_roles')
    .select('role_id, role')
    .eq('user_id', userId);

  if (error || !assignments?.length) return [];

  const roleIds = Array.from(
    new Set(assignments.map((row: any) => row.role_id).filter(Boolean)),
  ) as string[];

  const resolved = new Set<UserRole>();

  if (roleIds.length) {
    const { data: roleRows }: any = await supabase
      .from('roles')
      .select('id, name')
      .in('id', roleIds);

    for (const row of roleRows || []) {
      if (['sponsor', 'employer', 'workone', 'admin'].includes(row.name)) {
        resolved.add(row.name as UserRole);
      }
    }
  }

  for (const row of assignments) {
    if (['sponsor', 'employer', 'workone', 'admin'].includes(row.role)) {
      resolved.add(row.role as UserRole);
    }
  }

  return Array.from(resolved);
}

export async function assignRole(userId: string, role: UserRole, tenantId?: string) {
  const supabase = await requireAdminClient();
  const roleId = await resolveRoleId(role);

  if (!roleId) {
    throw new Error('Failed to assign role: role definition not found');
  }

  const { data: existing, error: lookupError }: any = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .maybeSingle();

  if (lookupError) {
    throw new Error('Failed to assign role');
  }
  if (existing) return existing;

  const payload: Record<string, unknown> = {
    user_id: userId,
    role_id: roleId,
  };
  if (tenantId) payload.tenant_id = tenantId;

  const { data, error }: any = await supabase
    .from('user_roles')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error('Failed to assign role');
  }

  return data;
}

export async function removeRole(userId: string, role: UserRole) {
  const supabase = await requireAdminClient();
  const roleId = await resolveRoleId(role);

  if (roleId) {
    const { error }: any = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw new Error('Failed to remove role');
    return;
  }

  // Legacy-only cleanup path.
  const { error }: any = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    throw new Error('Failed to remove role');
  }
}

export function getRolePermissions(role: UserRole) {
  const permissions: Record<UserRole, string[]> = {
    admin: ['view_all', 'edit_all', 'delete_all', 'manage_users', 'manage_billing', 'export_audit'],
    sponsor: [
      'view_apprentices',
      'edit_apprentices',
      'view_employers',
      'edit_employers',
      'view_funding',
      'edit_funding',
      'view_rapids',
      'edit_rapids',
      'export_audit',
    ],
    employer: ['view_own_apprentices', 'view_own_billing', 'submit_hours', 'view_own_invoices'],
    workone: [
      'view_apprentices',
      'view_funding',
      'view_rapids',
      'view_employers',
      'export_reports',
    ],
  };

  return permissions[role] || [];
}
