import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeRoles, type UserRole } from '@/lib/rbac/role-matrix';

/**
 * MFA policy is intentionally layered on top of the canonical role matrix.
 * Do not mutate auth.users or auth.mfa_factors directly; Supabase owns factor
 * enrollment, verification, recovery, and authenticator assurance levels.
 */
export const PRIVILEGED_MFA_ROLES: readonly UserRole[] = [
  'super_admin',
  'admin',
  'org_admin',
  'provider_admin',
  'workforce_board_admin',
];

export interface PrivilegedMfaResult {
  required: boolean;
  satisfied: boolean;
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  error?: string;
}

export async function checkPrivilegedMfa(
  supabase: SupabaseClient,
  effectiveRoles: readonly unknown[],
): Promise<PrivilegedMfaResult> {
  const roles = normalizeRoles([...effectiveRoles]);
  const required = roles.some((role) => PRIVILEGED_MFA_ROLES.includes(role));

  if (!required) {
    return { required: false, satisfied: true, currentLevel: null, nextLevel: null };
  }

  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) {
    return {
      required: true,
      satisfied: false,
      currentLevel: null,
      nextLevel: null,
      error: error.message,
    };
  }

  const currentLevel = data.currentLevel ?? null;
  const nextLevel = data.nextLevel ?? null;

  return {
    required: true,
    satisfied: currentLevel === 'aal2',
    currentLevel,
    nextLevel,
  };
}

/**
 * MFA enrollment remains available from security settings, but it is not a
 * global gate in front of portal login, role dashboards, learner/employer
 * portals, or the general admin dashboard. Sensitive actions can opt into MFA
 * explicitly without trapping ordinary portal navigation behind /mfa.
 */
export function privilegedMfaEnforcementEnabled(): boolean {
  return false;
}
