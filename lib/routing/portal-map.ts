import {
  ADMIN_ROLES,
  ALL_AUTHENTICATED_ROLES,
  APPRENTICE_ROLES,
  EMPLOYER_ROLES,
  HOST_SHOP_ROLES,
  INSTRUCTOR_ROLES,
  PROGRAM_HOLDER_ROLES,
  STAFF_ROLES,
  TESTING_CENTER_ROLES,
  WORKFORCE_ROLES,
  type UserRole,
} from '@/lib/rbac/role-matrix';

/**
 * Canonical cross-application portal registry.
 *
 * This is the single source of truth for portal identity, deployed ownership,
 * default route, display metadata, destination roles, access roles, tenant
 * scope and PWA persona metadata.
 */

function normalizeHost(value: string | undefined, fallback: string): string {
  const candidate = value?.trim() || fallback;
  return candidate.replace(/\/+$/, '');
}

export const MARKETING_HOST = normalizeHost(
  process.env.NEXT_PUBLIC_MARKETING_URL || process.env.NEXT_PUBLIC_SITE_URL,
  'https://www.elevateforhumanity.org',
);
export const ADMIN_HOST = normalizeHost(process.env.NEXT_PUBLIC_ADMIN_URL, 'https://admin.elevateforhumanity.org');
export const LMS_HOST = normalizeHost(process.env.NEXT_PUBLIC_APP_URL, 'https://app.elevateforhumanity.org');

export type PortalSubdomain = 'marketing' | 'admin' | 'app';
export type PortalAuthSurface = 'lms' | 'admin';
export type PortalTenantScope = 'self' | 'organization' | 'regional' | 'platform';

export interface PortalRoute {
  subdomain: PortalSubdomain;
  basePath: string;
  host: string;
  defaultPath: string;
  label: string;
  description: string;
  colorClass: string;
  iconName: string;
  destinationRoles: readonly UserRole[];
  accessRoles: readonly UserRole[];
  authSurface: PortalAuthSurface;
  tenantScope: PortalTenantScope;
  pwaManifest?: string;
  pwaScope?: string;
}

export const PORTAL_MAP = {
  lms: {
    subdomain: 'app', basePath: '/lms', host: LMS_HOST, defaultPath: '/lms/dashboard',
    label: 'Student Portal', description: 'Courses, assignments, progress, credentials, schedule, support and career services.',
    colorClass: 'bg-brand-blue-600', iconName: 'GraduationCap',
    destinationRoles: ['student', 'learner', 'user', 'delegate', 'grant_client'], accessRoles: ALL_AUTHENTICATED_ROLES,
    authSurface: 'lms', tenantScope: 'self', pwaManifest: '/manifest-student.json', pwaScope: '/lms',
  },
  employer: {
    subdomain: 'app', basePath: '/employer', host: LMS_HOST, defaultPath: '/employer/dashboard',
    label: 'Employer Portal', description: 'Jobs, candidates, apprenticeships, employer compliance, reporting and workforce operations.',
    colorClass: 'bg-amber-600', iconName: 'Briefcase',
    destinationRoles: ['employer', 'sponsor', 'recruiter'], accessRoles: EMPLOYER_ROLES,
    authSurface: 'lms', tenantScope: 'organization',
  },
  apprentice: {
    subdomain: 'app', basePath: '/apprentice', host: LMS_HOST, defaultPath: '/apprentice',
    label: 'Apprentice Portal', description: 'Registered apprenticeship OJL, RTI, competencies, documents, wage progression and completion evidence.',
    colorClass: 'bg-orange-600', iconName: 'UserCheck',
    destinationRoles: ['apprentice', 'barber_apprentice', 'cosmetology_apprentice'], accessRoles: APPRENTICE_ROLES,
    authSurface: 'lms', tenantScope: 'self', pwaManifest: '/manifest-apprentice.json', pwaScope: '/apprentice',
  },
  parent: {
    subdomain: 'app', basePath: '/parent-portal', host: LMS_HOST, defaultPath: '/parent-portal/dashboard',
    label: 'Parent Portal', description: 'Authorized learner progress, attendance and communications.',
    colorClass: 'bg-pink-600', iconName: 'Heart',
    destinationRoles: ['parent'], accessRoles: ['parent', 'admin', 'staff'],
    authSurface: 'lms', tenantScope: 'self',
  },
  workforce: {
    subdomain: 'app', basePath: '/workforce', host: LMS_HOST, defaultPath: '/workforce/dashboard',
    label: 'Workforce Portal', description: 'Participant management, training participation, placements, outcomes and workforce reporting.',
    colorClass: 'bg-gray-600', iconName: 'Wrench',
    destinationRoles: ['workforce_partner'], accessRoles: WORKFORCE_ROLES,
    authSurface: 'lms', tenantScope: 'organization',
  },
  hostshop: {
    subdomain: 'app', basePath: '/host-shop', host: LMS_HOST, defaultPath: '/host-shop/dashboard',
    label: 'Host Shop Portal', description: 'Apprentices, supervisors, OJL approvals, competencies, documents and registered-program compliance.',
    colorClass: 'bg-teal-600', iconName: 'Scissors',
    destinationRoles: ['partner', 'host_shop', 'host_shop_admin'], accessRoles: HOST_SHOP_ROLES,
    authSurface: 'lms', tenantScope: 'organization', pwaManifest: '/manifest-shop-owner.json', pwaScope: '/host-shop/',
  },
  programholder: {
    subdomain: 'app', basePath: '/program-holder', host: LMS_HOST, defaultPath: '/program-holder/dashboard',
    label: 'Program Holder Portal', description: 'Programs, students, training hours, documents and program-holder compliance responsibilities.',
    colorClass: 'bg-cyan-600', iconName: 'ClipboardList',
    destinationRoles: ['program_holder'], accessRoles: PROGRAM_HOLDER_ROLES,
    authSurface: 'lms', tenantScope: 'organization', pwaManifest: '/manifest-program-holder.json', pwaScope: '/program-holder/',
  },
  creator: {
    subdomain: 'app', basePath: '/creator', host: LMS_HOST, defaultPath: '/creator/products',
    label: 'Creator Studio', description: 'Build, manage and publish authorized learning products.',
    colorClass: 'bg-pink-600', iconName: 'Palette',
    destinationRoles: ['creator'], accessRoles: ['creator', 'admin'], authSurface: 'lms', tenantScope: 'self',
  },
  admin: {
    subdomain: 'admin', basePath: '', host: ADMIN_HOST, defaultPath: '/dashboard',
    label: 'Admin Portal', description: 'Platform administration, operations, compliance, CRM, programs, students and system oversight.',
    colorClass: 'bg-slate-700', iconName: 'Shield',
    destinationRoles: ['super_admin', 'admin', 'org_admin', 'advisor'], accessRoles: ADMIN_ROLES,
    authSurface: 'admin', tenantScope: 'platform',
  },
  instructor: {
    subdomain: 'admin', basePath: '/instructor', host: ADMIN_HOST, defaultPath: '/instructor/dashboard',
    label: 'Instructor Portal', description: 'Student rosters, submissions, progress, courses and instructional signoff work.',
    colorClass: 'bg-rose-600', iconName: 'Crown',
    destinationRoles: ['instructor'], accessRoles: INSTRUCTOR_ROLES,
    authSurface: 'admin', tenantScope: 'organization',
  },
  staff: {
    subdomain: 'admin', basePath: '/staff-portal', host: ADMIN_HOST, defaultPath: '/staff-portal/dashboard',
    label: 'Staff Portal', description: 'Student, enrollment, support, compliance and daily operational workflows.',
    colorClass: 'bg-emerald-600', iconName: 'Users',
    destinationRoles: ['staff'], accessRoles: STAFF_ROLES,
    authSurface: 'admin', tenantScope: 'organization',
  },
  testing: {
    subdomain: 'admin', basePath: '/testing-center', host: ADMIN_HOST, defaultPath: '/testing-center',
    label: 'Testing Center', description: 'Testing bookings, sessions, slots, providers and proctoring operations.',
    colorClass: 'bg-red-600', iconName: 'ClipboardCheck',
    destinationRoles: ['test_admin', 'proctor'], accessRoles: TESTING_CENTER_ROLES,
    authSurface: 'admin', tenantScope: 'organization',
  },
  workforceboard: {
    subdomain: 'marketing', basePath: '/workforce-board', host: MARKETING_HOST, defaultPath: '/workforce-board/dashboard',
    label: 'Workforce Board', description: 'Regional workforce oversight, provider performance, participation, credentials and outcomes.',
    colorClass: 'bg-indigo-600', iconName: 'Building2',
    destinationRoles: ['workforce_board', 'workforce_board_admin'], accessRoles: ['workforce_board', 'workforce_board_admin', 'admin', 'org_admin', 'staff'],
    authSurface: 'lms', tenantScope: 'regional',
  },
  casemanager: {
    subdomain: 'marketing', basePath: '/case-manager', host: MARKETING_HOST, defaultPath: '/case-manager/dashboard',
    label: 'Case Manager Portal', description: 'Assigned caseload, participant services, credentials, placements, tasks and reporting.',
    colorClass: 'bg-sky-600', iconName: 'ClipboardList',
    destinationRoles: ['case_manager'], accessRoles: ['case_manager', 'admin', 'staff'],
    authSurface: 'lms', tenantScope: 'organization',
  },
  provider: {
    subdomain: 'marketing', basePath: '/provider', host: MARKETING_HOST, defaultPath: '/provider/dashboard',
    label: 'Provider Portal', description: 'Training programs, enrollments, onboarding, compliance, service delivery and provider performance.',
    colorClass: 'bg-lime-600', iconName: 'Building2',
    destinationRoles: ['provider', 'provider_admin'], accessRoles: ['provider', 'provider_admin', 'admin', 'staff'],
    authSurface: 'lms', tenantScope: 'organization',
  },
} as const satisfies Record<string, PortalRoute>;

export type PortalKey = keyof typeof PORTAL_MAP;

export function getPortalRedirect(key: PortalKey, path = ''): string {
  const portal = PORTAL_MAP[key];
  if (!path) return `${portal.host}${portal.defaultPath}`;
  const suffix = `/${path.replace(/^\//, '')}`;
  return `${portal.host}${portal.basePath}${suffix}`;
}
export function getPortalHost(key: PortalKey): string { return PORTAL_MAP[key].host; }
export function getPortalKeyFromPath(pathname: string): PortalKey | null {
  const candidates = (Object.entries(PORTAL_MAP) as Array<[PortalKey, PortalRoute]>)
    .filter(([, portal]) => portal.basePath.length > 0)
    .sort(([, a], [, b]) => b.basePath.length - a.basePath.length);
  for (const [key, portal] of candidates) {
    if (pathname === portal.basePath || pathname.startsWith(`${portal.basePath}/`)) return key;
  }
  return null;
}
export function isMarketingRoute(pathname: string): boolean {
  return (Object.entries(PORTAL_MAP) as Array<[PortalKey, PortalRoute]>).some(([, portal]) =>
    portal.subdomain === 'marketing' && portal.basePath.length > 0 &&
    (pathname === portal.basePath || pathname.startsWith(`${portal.basePath}/`)),
  );
}
export function portalUrl(key: PortalKey, path = ''): string { return getPortalRedirect(key, path); }
