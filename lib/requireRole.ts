import { getAdminClient } from '@/lib/supabase/admin';

export type UserRole = 'sponsor' | 'employer' | 'workone' | 'admin';

export async function requireRole(userId: string, role: UserRole) {
  const supabase = await getAdminClient();

  const { data, error }: any = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId)
    .eq('role', role)
    .single();

  if (error || !data) {
    throw new Error('Unauthorized: Required role not found');
  }

  return data;
}

export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    await requireRole(userId, role);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const supabase = await getAdminClient();

  const { data, error }: any = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data.map((r) => r.role as UserRole);
}

export async function assignRole(
  userId: string,
  role: UserRole,
  tenant?: string
) {
  const supabase = await getAdminClient();

  const { data, error }: any = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role, tenant }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign role`);
  }

  return data;
}

export async function removeRole(userId: string, role: UserRole) {
  const supabase = await getAdminClient();

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', role);

  if (error) {
    throw new Error(`Failed to remove role`);
  }
}

export function getRolePermissions(role: UserRole) {
  const permissions: Record<UserRole, string[]> = {
    admin: [
      'view_all',
      'edit_all',
      'delete_all',
      'manage_users',
      'manage_billing',
      'export_audit',
    ],
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
    employer: [
      'view_own_apprentices',
      'view_own_billing',
      'submit_hours',
      'view_own_invoices',
    ],
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
