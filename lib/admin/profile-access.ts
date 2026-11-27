/**
 * Maps an admin user-status value to the `profiles` columns the LMS auth
 * guards actually read.
 *
 * `profiles.status` alone does NOT block LMS access — no LMS guard reads it
 * (see lib/auth/require-user.ts, lib/auth/require-role.ts,
 * lib/auth/require-api-role.ts, lib/auth.ts: all of them gate on
 * `is_active === false || suspended === true`). Suspending a student must
 * therefore set `suspended = true` AND `is_active = false`; re-activating
 * must clear both. The admin "suspend user" endpoint
 * (apps/admin/app/api/admin/users/update-status/route.ts) is the writer.
 *
 * `inactive` only clears `is_active` and leaves `suspended` untouched:
 * the account stays blocked either way, and a later re-activation clears
 * both columns.
 */

export type AdminUserStatus = 'active' | 'inactive' | 'suspended';

export type ProfileAccessUpdate = {
  status: AdminUserStatus;
  suspended?: boolean;
  is_active?: boolean;
};

export function resolveProfileAccessUpdate(status: AdminUserStatus): ProfileAccessUpdate {
  if (status === 'suspended') {
    return { status, suspended: true, is_active: false };
  }
  if (status === 'inactive') {
    return { status, is_active: false };
  }
  return { status, suspended: false, is_active: true };
}
