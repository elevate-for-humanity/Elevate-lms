/**
 * lib/routing/dashboard-resolver.ts
 *
 * SINGLE SOURCE OF TRUTH for role → dashboard URL resolution.
 *
 * Every login redirect and post-auth redirect should call DashboardResolver(role).
 * No hardcoded /learner/dashboard or /admin/dashboard redirects.
 */

import { MARKETING_HOST, ADMIN_HOST, LMS_HOST } from './portal-map';

interface RoleMapping {
  /** The role value stored in profiles.role */
  role: string;
  /** Display name for logging/debugging */
  label: string;
  /** Where to send the user after login */
  dashboardUrl: string;
  /** The portal key in PORTAL_MAP */
  portalKey: string;
}

const ROLE_MAPPINGS: RoleMapping[] = [
  // ── Student / Learner ────────────────────────────────────────────────────
  {
    role: 'student',
    label: 'Student',
    dashboardUrl: `${LMS_HOST}/lms/dashboard`,
    portalKey: 'lms',
  },
  {
    role: 'learner',
    label: 'Learner',
    dashboardUrl: `${LMS_HOST}/lms/dashboard`,
    portalKey: 'lms',
  },
  {
    role: 'user',
    label: 'User',
    dashboardUrl: `${LMS_HOST}/lms/dashboard`,
    portalKey: 'lms',
  },

  // ── Admin roles ────────────────────────────────────────────────────────────
  {
    role: 'admin',
    label: 'Admin',
    dashboardUrl: `${ADMIN_HOST}/admin/dashboard`,
    portalKey: 'admin',
  },
  {
    role: 'super_admin',
    label: 'Super Admin',
    dashboardUrl: `${ADMIN_HOST}/admin/dashboard`,
    portalKey: 'admin',
  },
  {
    role: 'org_admin',
    label: 'Org Admin',
    dashboardUrl: `${ADMIN_HOST}/admin/dashboard`,
    portalKey: 'admin',
  },
  {
    role: 'staff',
    label: 'Staff',
    dashboardUrl: `${ADMIN_HOST}/admin/staff-portal/dashboard`,
    portalKey: 'staff',
  },
  {
    role: 'instructor',
    label: 'Instructor',
    dashboardUrl: `${ADMIN_HOST}/admin/instructor/dashboard`,
    portalKey: 'instructor',
  },

  // ── Employer ──────────────────────────────────────────────────────────────
  {
    role: 'employer',
    label: 'Employer',
    dashboardUrl: `${LMS_HOST}/employer/dashboard`,
    portalKey: 'employer',
  },
  {
    role: 'recruiter',
    label: 'Recruiter',
    dashboardUrl: `${LMS_HOST}/employer/dashboard`,
    portalKey: 'employer',
  },

  // ── Apprenticeship ─────────────────────────────────────────────────────────
  {
    role: 'apprentice',
    label: 'Apprentice',
    dashboardUrl: `${LMS_HOST}/apprentice`,
    portalKey: 'apprentice',
  },
  {
    role: 'barber_apprentice',
    label: 'Barber Apprentice',
    dashboardUrl: `${LMS_HOST}/apprentice`,
    portalKey: 'apprentice',
  },
  {
    role: 'cosmetology_apprentice',
    label: 'Cosmetology Apprentice',
    dashboardUrl: `${LMS_HOST}/apprentice`,
    portalKey: 'apprentice',
  },

  // ── Host Shop ─────────────────────────────────────────────────────────────
  {
    role: 'host_shop',
    label: 'Host Shop',
    dashboardUrl: `${LMS_HOST}/host-shop/dashboard`,
    portalKey: 'hostshop',
  },
  {
    role: 'host_shop_admin',
    label: 'Host Shop Admin',
    dashboardUrl: `${LMS_HOST}/host-shop/dashboard`,
    portalKey: 'hostshop',
  },

  // ── Partner types ────────────────────────────────────────────────────────
  {
    role: 'partner',
    label: 'Partner',
    dashboardUrl: `${LMS_HOST}/partner/dashboard`,
    portalKey: 'partner',
  },
  {
    role: 'workforce_partner',
    label: 'Workforce Partner',
    dashboardUrl: `${LMS_HOST}/workforce/dashboard`,
    portalKey: 'workforce',
  },
  {
    role: 'program_holder',
    label: 'Program Holder',
    dashboardUrl: `${MARKETING_HOST}/program-holder/dashboard`,
    portalKey: 'programholder',
  },
  {
    role: 'provider',
    label: 'Training Provider',
    dashboardUrl: `${MARKETING_HOST}/provider/dashboard`,
    portalKey: 'provider',
  },
  {
    role: 'case_manager',
    label: 'Case Manager',
    dashboardUrl: `${MARKETING_HOST}/case-manager/dashboard`,
    portalKey: 'casemanager',
  },
  {
    role: 'workforce_board',
    label: 'Workforce Board',
    dashboardUrl: `${MARKETING_HOST}/workforce-board/dashboard`,
    portalKey: 'workforceboard',
  },
  {
    role: 'workforce_board_admin',
    label: 'Workforce Board Admin',
    dashboardUrl: `${MARKETING_HOST}/workforce-board/dashboard`,
    portalKey: 'workforceboard',
  },

  // ── Advisor ────────────────────────────────────────────────────────────────
  {
    role: 'advisor',
    label: 'Advisor',
    dashboardUrl: `${ADMIN_HOST}/admin/dashboard`,
    portalKey: 'admin',
  },

  // ── Parent ────────────────────────────────────────────────────────────────
  {
    role: 'parent',
    label: 'Parent',
    dashboardUrl: `${LMS_HOST}/parent-portal/dashboard`,
    portalKey: 'parent',
  },

  // ── Testing ──────────────────────────────────────────────────────────────
  {
    role: 'test_admin',
    label: 'Test Admin',
    dashboardUrl: `${ADMIN_HOST}/admin/testing-center`,
    portalKey: 'admin',
  },
  {
    role: 'proctor',
    label: 'Proctor',
    dashboardUrl: `${ADMIN_HOST}/admin/testing-center`,
    portalKey: 'admin',
  },
];

// ── Lookup ────────────────────────────────────────────────────────────────────

/**
 * Resolve a user role to their dashboard URL.
 * Admin users (admin, super_admin) always go to the admin dashboard.
 * Staff go to the staff portal.
 * All other roles use the table above.
 */
export function resolveDashboardUrl(
  role: string | null | undefined,
  effectiveRoles?: string[]
): string {
  const allRoles = effectiveRoles ?? [role].filter(Boolean) as string[];

  // Admin/super_admin/org_admin take priority
  if (
    allRoles.some((r) =>
      ['admin', 'super_admin', 'org_admin', 'advisor'].includes(r)
    )
  ) {
    return `${ADMIN_HOST}/admin/dashboard`;
  }

  // Staff portal
  if (allRoles.some((r) => ['staff'].includes(r))) {
    return `${ADMIN_HOST}/admin/staff-portal/dashboard`;
  }

  // Instructor
  if (allRoles.some((r) => ['instructor'].includes(r))) {
    return `${ADMIN_HOST}/admin/instructor/dashboard`;
  }

  // First matching role
  for (const r of allRoles) {
    const mapping = ROLE_MAPPINGS.find((m) => m.role === r);
    if (mapping) return mapping.dashboardUrl;
  }

  // Fallback: student dashboard
  return `${LMS_HOST}/lms/dashboard`;
}

/**
 * Get the portal key for a role.
 */
export function getPortalKeyForRole(
  role: string | null | undefined,
  effectiveRoles?: string[]
): string {
  const allRoles = effectiveRoles ?? [role].filter(Boolean) as string[];

  if (
    allRoles.some((r) =>
      ['admin', 'super_admin', 'org_admin', 'advisor'].includes(r)
    )
  ) {
    return 'admin';
  }
  if (allRoles.some((r) => ['staff'].includes(r))) return 'staff';
  if (allRoles.some((r) => ['instructor'].includes(r))) return 'instructor';

  for (const r of allRoles) {
    const mapping = ROLE_MAPPINGS.find((m) => m.role === r);
    if (mapping) return mapping.portalKey;
  }
  return 'lms';
}

/**
 * Get the display label for a role.
 */
export function getRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Unknown';
  const mapping = ROLE_MAPPINGS.find((m) => m.role === role);
  return mapping?.label ?? role;
}
