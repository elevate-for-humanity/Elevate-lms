/**
 * Runtime navigation helper for canonical portal links.
 *
 * Portal ownership and default paths come only from portal-map.ts.
 */

import { MARKETING_HOST, PORTAL_MAP, type PortalKey } from './portal-map';

export { type PortalKey } from './portal-map';

export const PORTAL_KEYS = Object.keys(PORTAL_MAP) as PortalKey[];

export interface PortalMeta {
  key: PortalKey;
  label: string;
  description: string;
  colorClass: string;
  iconName: string;
}

export const PORTAL_META: Record<PortalKey, PortalMeta> = {
  lms: {
    key: 'lms',
    label: 'Student Portal',
    description: 'Access courses, assignments, grades, and certificates',
    colorClass: 'bg-brand-blue-600',
    iconName: 'GraduationCap',
  },
  employer: {
    key: 'employer',
    label: 'Employer Portal',
    description: 'Post jobs, manage apprentices, view partnerships',
    colorClass: 'bg-amber-600',
    iconName: 'Briefcase',
  },
  apprentice: {
    key: 'apprentice',
    label: 'Apprentice Portal',
    description: 'Track OJT hours, RTI, competencies, and documents',
    colorClass: 'bg-orange-600',
    iconName: 'UserCheck',
  },
  parent: {
    key: 'parent',
    label: 'Parent Portal',
    description: 'Track student progress and communications',
    colorClass: 'bg-pink-600',
    iconName: 'Heart',
  },
  workforce: {
    key: 'workforce',
    label: 'Workforce Portal',
    description: 'Workforce development and job training',
    colorClass: 'bg-gray-600',
    iconName: 'Wrench',
  },
  hostshop: {
    key: 'hostshop',
    label: 'Host Shop Portal',
    description: 'Track apprentices, OJT hours, documents, and competencies',
    colorClass: 'bg-teal-600',
    iconName: 'Scissors',
  },
  admin: {
    key: 'admin',
    label: 'Admin Portal',
    description: 'Platform administration and management',
    colorClass: 'bg-slate-700',
    iconName: 'Shield',
  },
  instructor: {
    key: 'instructor',
    label: 'Instructor Portal',
    description: 'Class management, student progress, and grades',
    colorClass: 'bg-rose-600',
    iconName: 'Crown',
  },
  staff: {
    key: 'staff',
    label: 'Staff Portal',
    description: 'Student management and enrollment support',
    colorClass: 'bg-emerald-600',
    iconName: 'Users',
  },
  testing: {
    key: 'testing',
    label: 'Testing Center',
    description: 'Testing bookings, sessions, slots, and proctoring',
    colorClass: 'bg-red-600',
    iconName: 'ClipboardCheck',
  },
  workforceboard: {
    key: 'workforceboard',
    label: 'Workforce Board',
    description: 'Regional workforce oversight and outcomes',
    colorClass: 'bg-indigo-600',
    iconName: 'Building2',
  },
  casemanager: {
    key: 'casemanager',
    label: 'Case Manager Portal',
    description: 'Client case management and referrals',
    colorClass: 'bg-sky-600',
    iconName: 'ClipboardList',
  },
  provider: {
    key: 'provider',
    label: 'Provider Portal',
    description: 'Training provider management and compliance',
    colorClass: 'bg-lime-600',
    iconName: 'Building2',
  },
  programholder: {
    key: 'programholder',
    label: 'Program Holder Portal',
    description: 'Program management and compliance',
    colorClass: 'bg-cyan-600',
    iconName: 'ClipboardList',
  },
  creator: {
    key: 'creator',
    label: 'Creator Studio',
    description: 'Build and publish learning products',
    colorClass: 'bg-pink-600',
    iconName: 'Palette',
  },
};

export const PortalRouter = {
  get(key: PortalKey): string {
    const portal = PORTAL_MAP[key];
    return `${portal.host}${portal.defaultPath}`;
  },

  getPath(key: PortalKey, path: string): string {
    const portal = PORTAL_MAP[key];
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.host}${portal.basePath}${cleanPath}`;
  },

  path(key: PortalKey, path = ''): string {
    const portal = PORTAL_MAP[key];
    if (!path) return portal.defaultPath;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.basePath}${cleanPath}`;
  },

  basePath(key: PortalKey): string {
    return PORTAL_MAP[key].basePath;
  },

  has(key: string): key is PortalKey {
    return key in PORTAL_MAP;
  },

  meta(key: PortalKey): PortalMeta {
    return PORTAL_META[key];
  },

  keys(): PortalKey[] {
    return PORTAL_KEYS;
  },

  fallback(): string {
    return MARKETING_HOST;
  },
};
