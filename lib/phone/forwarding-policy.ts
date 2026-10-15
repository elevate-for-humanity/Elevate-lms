export const ADMIN_FORWARDING_NUMBER = '+13177607908';

export function adminForwardingAllowed(
  system: { tenant_id?: string | null } | null,
  extension: { extension?: string } | null,
  roles: readonly string[],
): boolean {
  return system?.tenant_id === null && extension?.extension === '0' &&
    roles.some((role) => role === 'admin' || role === 'super_admin');
}
