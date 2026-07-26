/**
 * lib/routing/portal-router.ts
 *
 * Runtime navigation helper for portal links.
 * Use PortalRouter.get() in all navigation components — never hardcode URLs.
 *
 * Usage:
 *   import { PortalRouter } from '@/lib/routing/portal-router';
 *   <Link href={PortalRouter.get('admin')}>Admin Portal</Link>
 *   <Link href={PortalRouter.get('lms')}>Student Portal</Link>
 */

import { PORTAL_MAP, MARKETING_HOST, getPortalHost, getPortalRedirect } from './portal-map';

// ── Typed portal keys for compile-time safety ─────────────────────────────────

export const PORTAL_KEYS = Object.keys(PORTAL_MAP) as PortalKey[];

export type PortalKey = keyof typeof PORTAL_MAP;

// ── Portal metadata for UI (icons, labels) ──────────────────────────────────

export interface PortalMeta {
  key: PortalKey;
  label: string;
  description: string;
  /** Tailwind color class for the icon badge */
  colorClass: string;
  /** Icon name (lucide) */
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
  admin: {
    key: 'admin',
    label: 'Admin Portal',
    description: 'Platform administration and management',
    colorClass: 'bg-slate-700',
    iconName: 'Shield',
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
    description: 'Track hours, competencies, and training progress',
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
    description: 'Track apprentices, OJT hours, and competencies',
    colorClass: 'bg-teal-600',
    iconName: 'Scissors',
  },
  cosmetology: {
    key: 'cosmetology',
    label: 'Cosmetology Host Shop',
    description: 'Cosmetology apprenticeship management',
    colorClass: 'bg-fuchsia-600',
    iconName: 'Palette',
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
  workforceboard: {
    key: 'workforceboard',
    label: 'Workforce Board',
    description: 'Career services, job matching, and placement',
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
    description: 'Training provider management',
    colorClass: 'bg-lime-600',
    iconName: 'Building2',
  },
  partner: {
    key: 'partner',
    label: 'Partner Portal',
    description: 'Manage partnerships, programs, and host shops',
    colorClass: 'bg-purple-600',
    iconName: 'Handshake',
  },
  programholder: {
    key: 'programholder',
    label: 'Program Holder Portal',
    description: 'Program management and compliance',
    colorClass: 'bg-cyan-600',
    iconName: 'ClipboardList',
  },
};

// ── Router ───────────────────────────────────────────────────────────────────

export const PortalRouter = {
  /**
   * Get the full URL for a portal key.
   * Use this in Link href, router.push, redirect, etc.
   *
   * @example PortalRouter.get('admin') → 'https://admin.elevateforhumanity.org/admin/dashboard'
   * @example PortalRouter.get('lms') → 'https://app.elevateforhumanity.org/lms/dashboard'
   */
  get(key: PortalKey): string {
    const portal = PORTAL_MAP[key];
    if (!portal) return MARKETING_HOST;
    return `${portal.host}${portal.defaultPath}`;
  },

  /**
   * Get URL with a custom path appended.
   * @example PortalRouter.get('lms', '/courses') → 'https://app.elevateforhumanity.org/lms/courses'
   */
  getPath(key: PortalKey, path: string): string {
    const portal = PORTAL_MAP[key];
    if (!portal) return MARKETING_HOST;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.host}${portal.basePath}${cleanPath}`;
  },

  /**
   * Get only the path portion (no host) for a portal key.
   * Use this for relative navigation within the same app.
   */
  path(key: PortalKey, path = ''): string {
    const portal = PORTAL_MAP[key];
    if (!portal) return '/';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${portal.basePath}${cleanPath}`;
  },

  /**
   * Get the base path for a portal (no host, no default path).
   * e.g. '/lms', '/admin', '/employer'
   */
  basePath(key: PortalKey): string {
    return PORTAL_MAP[key]?.basePath ?? '/';
  },

  /**
   * Check if a portal exists.
   */
  has(key: string): key is PortalKey {
    return key in PORTAL_MAP;
  },

  /**
   * Get metadata for a portal key.
   */
  meta(key: PortalKey): PortalMeta {
    return PORTAL_META[key];
  },

  /**
   * Get all portal keys.
   */
  keys(): PortalKey[] {
    return PORTAL_KEYS;
  },
};
