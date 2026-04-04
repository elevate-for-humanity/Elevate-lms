import { requireUser } from './require-user';

// Roles that may access admin surfaces.
// 'staff' is intentionally excluded — staff use /staff-portal, not /admin.
const ADMIN_ROLES = ['admin', 'super_admin'] as const;

/**
 * Asserts an authenticated admin session exists.
 * Throws — never returns null or a degraded state.
 *
 * Usage:
 *   const { user } = await requireAdmin();
 */
export async function requireAdmin() {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) throw new Error(`PROFILE_FETCH_FAILED: ${error.message}`);
  if (!data) throw new Error('PROFILE_NOT_FOUND');
  if (!(ADMIN_ROLES as readonly string[]).includes(data.role)) throw new Error('FORBIDDEN');

  return { user, supabase, role: data.role as (typeof ADMIN_ROLES)[number] };
}
