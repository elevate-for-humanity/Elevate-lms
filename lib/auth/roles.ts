/**
 * Tax platform role and permission model.
 *
 * Separate from the LMS role model (UserRole in lib/types).
 * These roles govern access to tax return preparation, review,
 * transmission, and firm operations.
 */

export type TaxRole =
  | 'super_admin'
  | 'firm_owner'
  | 'office_manager'
  | 'preparer'
  | 'reviewer'
  | 'transmitter'
  | 'support';

// Permission strings follow the pattern resource:action
// '*' grants all permissions
const PERMISSIONS: Record<TaxRole, string[]> = {
  super_admin: ['*'],
  firm_owner: [
    'returns:*',
    'clients:*',
    'billing:*',
    'documents:*',
    'users:*',
    'offices:*',
    'transmissions:*',
  ],
  office_manager: [
    'returns:*',
    'clients:*',
    'documents:*',
    'users:read',
    'offices:read',
    'transmissions:read',
  ],
  preparer: [
    'returns:create',
    'returns:edit',
    'returns:read',
    'clients:read',
    'documents:upload',
    'documents:read',
  ],
  reviewer: [
    'returns:read',
    'returns:review',
    'returns:approve',
    'documents:read',
  ],
  transmitter: [
    'returns:read',
    'returns:transmit',
    'transmissions:read',
    'transmissions:create',
    'ack:read',
  ],
  support: [
    'clients:read',
    'returns:read',
    'documents:read',
  ],
};

/**
 * Check whether a role has a given permission.
 *
 * Supports wildcard resource grants (e.g. 'returns:*' matches 'returns:edit').
 */
export function can(role: TaxRole, permission: string): boolean {
  const granted = PERMISSIONS[role] ?? [];

  if (granted.includes('*')) return true;
  if (granted.includes(permission)) return true;

  // Check wildcard resource grant: 'returns:*' matches 'returns:edit'
  const [resource] = permission.split(':');
  if (granted.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Returns all permissions granted to a role, expanded from wildcards.
 * Useful for client-side permission checks.
 */
export function getPermissions(role: TaxRole): string[] {
  return PERMISSIONS[role] ?? [];
}

/**
 * Returns true if the role can transmit returns to IRS.
 */
export function canTransmit(role: TaxRole): boolean {
  return can(role, 'returns:transmit');
}

/**
 * Returns true if the role can approve returns for filing.
 */
export function canApprove(role: TaxRole): boolean {
  return can(role, 'returns:approve');
}

/**
 * Returns true if the role has any administrative capability.
 */
export function isAdminRole(role: TaxRole): boolean {
  return role === 'super_admin' || role === 'firm_owner' || role === 'office_manager';
}
