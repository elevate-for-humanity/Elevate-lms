import { createClient } from '@/lib/supabase/server';

/**
 * RBAC Helper - Role-Based Access Control
 *
 * Enforces role-based permissions at the API layer
 *
 * Roles:
 * - admin: Full system access
 * - hr_admin: HR and payroll management
 * - super_admin: Super admin access
 * - marketing_admin: Marketing campaigns and contacts
 * - manager: Team management
 * - provider_admin: Program holder admin
 * - delegate: Case management
 * - student: Student portal access
 */

export type AppRole =
  | "admin"
  | "hr_admin"
  | "super_admin"
  | "delegate"
  | "program_holder"
  | "student"
  | "staff"
  | "marketing_admin"
  | "manager"
  | "provider_admin";

export interface SessionUser {
  id: string;
  email?: string;
  role?: AppRole | string | null;
}

/**
 * Fetch current authenticated user + profile row (with role).
 */
export async function getCurrentUserWithRole(): Promise<{
  user: SessionUser | null;
  profile: { id: string; role?: string | null; full_name?: string; email?: string } | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profileError) {
    // We still return the raw user so callers can decide what to do
    return {
      user: {
        id: user.id,
        email: user.email || undefined,
        role: null,
      },
      profile: null,
    };
  }

  return {
    user: {
      id: user.id,
      email: user.email || undefined,
      role: (profile?.role || null) as AppRole | string | null,
    },
    profile,
  };
}

/**
 * Require that the current user has at least one of the allowed roles.
 * Throws an Error if not authorized.
 */
export async function requireAdmin(
  allowedRoles: AppRole[] = ["admin", "hr_admin", "super_admin"]
) {
  const { user, profile } = await getCurrentUserWithRole();

  if (!user || !profile) {
    throw new Error("Not authenticated");
  }

  const role = (user.role || profile.role) as AppRole | string | null;

  if (!role || !allowedRoles.includes(role as AppRole)) {
    throw new Error("Not authorized");
  }

  return { user, profile, role };
}

/**
 * Convenience helper for checking any role list.
 */
export async function requireRole(allowedRoles: AppRole[] | string[]) {
  const { user, profile } = await getCurrentUserWithRole();

  if (!user || !profile) {
    throw new Error('UNAUTHENTICATED');
  }

  const role = (user.role || profile.role) as AppRole;

  if (!allowedRoles.includes(role as AppRole)) {
    throw new Error('FORBIDDEN');
  }

  return { user, profile };
}

/**
 * Check if user has any of the specified roles
 */
export async function hasRole(roles: string[]): Promise<boolean> {
  try {
    await requireRole(roles);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get current user's role
 */
export async function getCurrentRole(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role || null;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware-style error handler for RBAC
 */
export function handleRBACError(error: Error) {
  if (error.message === 'UNAUTHENTICATED') {
    return { error: 'Unauthenticated', status: 401 };
  }
  if (error.message === 'FORBIDDEN') {
    return { error: 'Forbidden - insufficient permissions', status: 403 };
  }
  if (error.message === 'PROFILE_NOT_FOUND') {
    return { error: 'User profile not found', status: 404 };
  }
  return { error: 'Internal server error', status: 500 };
}

/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 100,
  hr_admin: 80,
  marketing_admin: 80,
  manager: 60,
  provider_admin: 50,
  delegate: 40,
  student: 20,
};

/**
 * Check if user's role is at least the specified level
 */
export async function requireRoleLevel(
  minRole: string
): Promise<{ user: any; profile: any }> {
  const { user, profile } = await requireRole(Object.keys(ROLE_HIERARCHY));

  const userLevel = ROLE_HIERARCHY[profile.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 0;

  if (userLevel < requiredLevel) {
    throw new Error('FORBIDDEN');
  }

  return { user, profile };
}
