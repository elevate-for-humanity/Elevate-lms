/**
 * Guard function for report access
 * Only org admins, staff, auditors, and super admins can access reports
 */
export function requireReportAccess(role: string): void {
  const allowedRoles = ['org_admin', 'staff', 'auditor', 'super_admin'];

  if (!allowedRoles.includes(role)) {
    throw new Error(
      'Unauthorized: Report access requires admin, staff, or auditor role'
    );
  }
}
