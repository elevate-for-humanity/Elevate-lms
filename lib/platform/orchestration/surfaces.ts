import { PlatformFeature, type PlatformFeatureKey } from '@/lib/platform/features';

export type PlatformRuntime = 'marketing' | 'lms' | 'admin';
export type PlatformSurfaceScope =
  | 'public'
  | 'individual_app'
  | 'organization'
  | 'role'
  | 'platform_admin';

export interface PlatformSurfaceContract {
  key: string;
  label: string;
  runtime: PlatformRuntime;
  entryPath: string;
  scope: PlatformSurfaceScope;
  requiredFeature?: PlatformFeatureKey;
  subscriptionSlug?: string;
  provisioningKind?: string;
}

/**
 * One route/capability contract for every major product surface.
 * Navigation, commercial access, provisioning and smoke tests should resolve
 * from this registry instead of inventing independent route/feature maps.
 */
export const PLATFORM_SURFACES: Record<string, PlatformSurfaceContract> = {
  store: {
    key: 'store', label: 'Store', runtime: 'marketing', entryPath: '/store', scope: 'public',
  },
  website_builder: {
    key: 'website_builder', label: 'Website Builder', runtime: 'marketing',
    entryPath: '/apps/website-builder', scope: 'individual_app',
    requiredFeature: PlatformFeature.WEBSITE_BUILDER,
    subscriptionSlug: 'website-builder', provisioningKind: 'website_workspace',
  },
  sam_gov: {
    key: 'sam_gov', label: 'SAM.gov Manager', runtime: 'marketing',
    entryPath: '/apps/sam-gov', scope: 'individual_app',
    requiredFeature: PlatformFeature.SAM_GOV_MANAGER,
    subscriptionSlug: 'sam-gov', provisioningKind: 'sam_gov_workspace',
  },
  grants: {
    key: 'grants', label: 'Grants Discovery', runtime: 'marketing',
    entryPath: '/apps/grants', scope: 'individual_app',
    requiredFeature: PlatformFeature.GRANTS_DISCOVERY,
    subscriptionSlug: 'grants', provisioningKind: 'grants_workspace',
  },
  crm: {
    key: 'crm', label: 'CRM', runtime: 'admin', entryPath: '/crm', scope: 'organization',
    requiredFeature: PlatformFeature.CRM, provisioningKind: 'crm_workspace',
  },
  bookings: {
    key: 'bookings', label: 'Bookings', runtime: 'admin', entryPath: '/bookings', scope: 'organization',
    requiredFeature: PlatformFeature.BOOKING,
  },
  forms: {
    key: 'forms', label: 'Forms', runtime: 'admin', entryPath: '/forms', scope: 'organization',
    requiredFeature: PlatformFeature.FORMS,
  },
  email_marketing: {
    key: 'email_marketing', label: 'Email Marketing', runtime: 'admin',
    entryPath: '/marketing', scope: 'organization', requiredFeature: PlatformFeature.EMAIL_MARKETING,
  },
  automations: {
    key: 'automations', label: 'Automations', runtime: 'admin',
    entryPath: '/automations', scope: 'organization', requiredFeature: PlatformFeature.AUTOMATIONS,
  },
  invoicing: {
    key: 'invoicing', label: 'Invoicing', runtime: 'admin',
    entryPath: '/billing', scope: 'organization', requiredFeature: PlatformFeature.INVOICING,
  },
  analytics: {
    key: 'analytics', label: 'Analytics', runtime: 'admin',
    entryPath: '/analytics', scope: 'organization', requiredFeature: PlatformFeature.ANALYTICS,
  },
  lms: {
    key: 'lms', label: 'Learning Management System', runtime: 'lms',
    entryPath: '/lms/dashboard', scope: 'organization', requiredFeature: PlatformFeature.LMS,
    provisioningKind: 'lms_workspace',
  },
  course_builder: {
    key: 'course_builder', label: 'Course Builder', runtime: 'admin',
    entryPath: '/studio/courses', scope: 'organization', requiredFeature: PlatformFeature.COURSE_BUILDER,
    provisioningKind: 'course_workspace',
  },
  course_factory: {
    key: 'course_factory', label: 'AI Course Factory', runtime: 'lms',
    entryPath: '/studio/course-factory', scope: 'organization', requiredFeature: PlatformFeature.COURSE_FACTORY,
  },
  student_management: {
    key: 'student_management', label: 'Student Management', runtime: 'admin',
    entryPath: '/students', scope: 'organization', requiredFeature: PlatformFeature.STUDENT_MANAGEMENT,
  },
  instructor_tools: {
    key: 'instructor_tools', label: 'Instructor Tools', runtime: 'lms',
    entryPath: '/instructor', scope: 'role', requiredFeature: PlatformFeature.INSTRUCTOR_TOOLS,
  },
  workforce: {
    key: 'workforce', label: 'Workforce', runtime: 'admin',
    entryPath: '/workforce', scope: 'organization', requiredFeature: PlatformFeature.WORKFORCE,
  },
  apprenticeship: {
    key: 'apprenticeship', label: 'Apprenticeship Management', runtime: 'lms',
    entryPath: '/apprentice', scope: 'organization', requiredFeature: PlatformFeature.APPRENTICESHIP,
    provisioningKind: 'apprenticeship_workspace',
  },
  employer_portal: {
    key: 'employer_portal', label: 'Employer Portal', runtime: 'lms',
    entryPath: '/employer/dashboard', scope: 'role', requiredFeature: PlatformFeature.EMPLOYER_PORTAL,
  },
  host_shop_portal: {
    key: 'host_shop_portal', label: 'Host Shop Portal', runtime: 'lms',
    entryPath: '/host-shop/dashboard', scope: 'role', requiredFeature: PlatformFeature.APPRENTICESHIP,
  },
  testing_center: {
    key: 'testing_center', label: 'Testing Center', runtime: 'admin',
    entryPath: '/testing-center', scope: 'organization', requiredFeature: PlatformFeature.TESTING_CENTER,
    provisioningKind: 'testing_center_workspace',
  },
  compliance: {
    key: 'compliance', label: 'Compliance', runtime: 'admin',
    entryPath: '/compliance', scope: 'organization', requiredFeature: PlatformFeature.COMPLIANCE,
  },
  media_studio: {
    key: 'media_studio', label: 'Media Studio', runtime: 'admin',
    entryPath: '/studio/media', scope: 'organization', requiredFeature: PlatformFeature.MEDIA_STUDIO,
  },
  ai_paris: {
    key: 'ai_paris', label: 'PARIS', runtime: 'admin',
    entryPath: '/ai/paris', scope: 'organization', requiredFeature: PlatformFeature.AI_PARIS,
  },
  ai_ellie: {
    key: 'ai_ellie', label: 'ELLIE', runtime: 'admin',
    entryPath: '/ai/ellie', scope: 'organization', requiredFeature: PlatformFeature.AI_ELLIE,
  },
  ai_lizzy: {
    key: 'ai_lizzy', label: 'LIZZY', runtime: 'admin',
    entryPath: '/ai/lizzy', scope: 'organization', requiredFeature: PlatformFeature.AI_LIZZY,
  },
  ai_zora: {
    key: 'ai_zora', label: 'ZORA', runtime: 'admin',
    entryPath: '/ai/zora', scope: 'organization', requiredFeature: PlatformFeature.AI_ZORA,
  },
  dev_studio: {
    key: 'dev_studio', label: 'Dev Studio', runtime: 'admin',
    entryPath: '/studio', scope: 'platform_admin', requiredFeature: PlatformFeature.DEV_STUDIO,
  },
};

export function getPlatformSurface(key: string): PlatformSurfaceContract | null {
  return PLATFORM_SURFACES[key] ?? null;
}

export function getPlatformSurfaceByPath(
  runtime: PlatformRuntime,
  pathname: string,
): PlatformSurfaceContract | null {
  const candidates = Object.values(PLATFORM_SURFACES)
    .filter((surface) => surface.runtime === runtime && pathname.startsWith(surface.entryPath))
    .sort((a, b) => b.entryPath.length - a.entryPath.length);
  return candidates[0] ?? null;
}
