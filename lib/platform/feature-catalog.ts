/**
 * SaaS feature and add-on catalog.
 *
 * Canonical capability strings come from lib/platform/features.ts. Legacy DB
 * values are normalized here so older rows continue to unlock the same feature.
 */

import { PlatformFeature, type PlatformFeatureKey } from '@/lib/platform/features';

export const FEATURES = {
  CRM: PlatformFeature.CRM,
  WEBSITE: PlatformFeature.WEBSITE,
  WEBSITE_BUILDER: PlatformFeature.WEBSITE_BUILDER,
  WEBSITE_IMPORT: PlatformFeature.WEBSITE_IMPORT,
  CUSTOM_DOMAIN: PlatformFeature.CUSTOM_DOMAIN,
  BOOKINGS: PlatformFeature.BOOKING,
  FORMS: PlatformFeature.FORMS,
  EMAIL_MARKETING: PlatformFeature.EMAIL_MARKETING,
  AI_BASIC: PlatformFeature.AI_BASIC,
  AI: PlatformFeature.AI_ADVANCED,
  AI_PARIS: PlatformFeature.AI_PARIS,
  AI_ELLIE: PlatformFeature.AI_ELLIE,
  AI_LIZZY: PlatformFeature.AI_LIZZY,
  AI_ZORA: PlatformFeature.AI_ZORA,
  AI_ORCHESTRATOR: PlatformFeature.AI_ORCHESTRATOR,
  AI_VOICE: PlatformFeature.AI_VOICE,
  SMS: PlatformFeature.SMS,
  AUTOMATION: PlatformFeature.AUTOMATIONS,
  INVOICING: PlatformFeature.INVOICING,
  LEAD_FUNNELS: PlatformFeature.LEAD_FUNNELS,
  CLIENT_PORTAL: PlatformFeature.CLIENT_PORTAL,
  ANALYTICS: PlatformFeature.ANALYTICS,
  SEO_AUTOPILOT: PlatformFeature.SEO_AUTOPILOT,
  MARKETING_AUTOPILOT: PlatformFeature.MARKETING_AUTOPILOT,
  LMS: PlatformFeature.LMS,
  COURSE_BUILDER: PlatformFeature.COURSE_BUILDER,
  COURSE_FACTORY: PlatformFeature.COURSE_FACTORY,
  CERTIFICATES: PlatformFeature.CERTIFICATES,
  CREDENTIALS: PlatformFeature.CREDENTIALS,
  STUDENT_MANAGEMENT: PlatformFeature.STUDENT_MANAGEMENT,
  INSTRUCTOR_TOOLS: PlatformFeature.INSTRUCTOR_TOOLS,
  MEDIA_STUDIO: PlatformFeature.MEDIA_STUDIO,
  COMMUNITY: PlatformFeature.COMMUNITY,
  COMMUNITY_GROUPS: PlatformFeature.COMMUNITY_GROUPS,
  COMMUNITY_EVENTS: PlatformFeature.COMMUNITY_EVENTS,
  COMMUNITY_GAMIFICATION: PlatformFeature.COMMUNITY_GAMIFICATION,
  COMMUNITY_MEMBERSHIPS: PlatformFeature.COMMUNITY_MEMBERSHIPS,
  WORKFLOW_AUTOMATION: PlatformFeature.WORKFLOW_AUTOMATION,
  REPORTING: PlatformFeature.REPORTING,
  CUSTOM_BRANDING: PlatformFeature.CUSTOM_BRANDING,
  WORKFORCE: PlatformFeature.WORKFORCE,
  APPRENTICESHIP: PlatformFeature.APPRENTICESHIP,
  EMPLOYER_PORTAL: PlatformFeature.EMPLOYER_PORTAL,
  TESTING_CENTER: PlatformFeature.TESTING_CENTER,
  COMPLIANCE: PlatformFeature.COMPLIANCE,
  SAM_GOV_MANAGER: PlatformFeature.SAM_GOV_MANAGER,
  GRANTS_DISCOVERY: PlatformFeature.GRANTS_DISCOVERY,
  WHITE_LABEL_MOBILE: PlatformFeature.WHITE_LABEL_MOBILE,
  API_ACCESS: PlatformFeature.API_ACCESS,
  DEV_STUDIO: PlatformFeature.DEV_STUDIO,
  DEPLOYMENT_AUTOPILOT: PlatformFeature.DEPLOYMENT_AUTOPILOT,
  CONTAINER_MANAGEMENT: PlatformFeature.CONTAINER_MANAGEMENT,
} as const;

export type FeatureCode = PlatformFeatureKey;

const LEGACY_FEATURE_ALIASES: Record<string, FeatureCode> = {
  bookings: PlatformFeature.BOOKING,
  booking: PlatformFeature.BOOKING,
  automation: PlatformFeature.AUTOMATIONS,
  automations: PlatformFeature.AUTOMATIONS,
  ai: PlatformFeature.AI_ADVANCED,
};

export function normalizeFeatureCode(code: string): FeatureCode | null {
  const normalized = LEGACY_FEATURE_ALIASES[code] ?? code;
  return (Object.values(PlatformFeature) as string[]).includes(normalized)
    ? (normalized as FeatureCode)
    : null;
}

/** Monthly add-on prices (USD) — mirror Store pricing and DB seed. */
export const ADDONS = {
  LMS: 29,
  COMMUNITY_HUB: 39,
  AI_ASSISTANT: 19,
  PARIS_ASSISTANT: 19,
  ELLIE_ASSISTANT: 19,
  LIZZY_ASSISTANT: 29,
  ZORA_ASSISTANT: 29,
  AI_TEAM: 79,
  AI_VOICE: 15,
  COURSE_CREATION_LEARNING_PLATFORM: 79,
  COURSE_BUILDER: 29,
  AI_COURSE_FACTORY: 49,
  SMS: 15,
  STUDENT_MANAGEMENT: 49,
  WORKFORCE_DEVELOPMENT: 99,
  APPRENTICESHIP_MANAGEMENT: 99,
  EMPLOYER_PORTAL: 49,
  TESTING_CENTER: 49,
  WHITE_LABEL_APP: 199,
  ADDITIONAL_USER: 10,
  ADDITIONAL_LOCATION: 25,
  ADDITIONAL_STORAGE_100GB: 10,
} as const;

/** Checkout slug (store) → DB addon code. */
export const ADDON_SLUG_TO_CATALOG_CODE: Record<string, string> = {
  'ai-addon': 'ai-assistant',
  'paris-assistant': 'paris-assistant',
  'ellie-assistant': 'ellie-assistant',
  'lizzy-assistant': 'lizzy-assistant',
  'zora-assistant': 'zora-assistant',
  'ai-team': 'ai-team',
  'ai-voice': 'ai-voice',
  'course-creation-learning-platform': 'course-creation-learning-platform',
  'online-courses-lms': 'lms',
  'community-hub': 'community-hub',
  'course-builder': 'course-builder',
  'ai-course-factory': 'ai-course-factory',
  'text-messaging': 'sms',
  'student-management': 'student-management',
  'workforce-development': 'workforce-development',
  'apprenticeship-management': 'apprenticeship-management',
  'employer-portal': 'employer-portal',
  'credential-testing-center': 'testing-center',
  'white-label-mobile': 'white-label-mobile',
  'additional-user': 'additional-user',
  'additional-location': 'additional-location',
  'additional-storage': 'additional-storage',
};

/**
 * Code-side entitlement fallback. This keeps newly introduced add-ons usable
 * immediately even if a database catalog migration is delayed. DB feature_codes
 * still win when present.
 */
export const ADDON_FEATURE_FALLBACK: Record<string, FeatureCode[]> = {
  'ai-assistant': [PlatformFeature.AI_ADVANCED, PlatformFeature.AI_CONTENT, PlatformFeature.AI_CHAT_WIDGET],
  'paris-assistant': [PlatformFeature.AI_PARIS],
  'ellie-assistant': [PlatformFeature.AI_ELLIE],
  'lizzy-assistant': [PlatformFeature.AI_LIZZY],
  'zora-assistant': [PlatformFeature.AI_ZORA],
  'ai-team': [
    PlatformFeature.AI_PARIS,
    PlatformFeature.AI_ELLIE,
    PlatformFeature.AI_LIZZY,
    PlatformFeature.AI_ZORA,
    PlatformFeature.AI_ORCHESTRATOR,
  ],
  'ai-voice': [PlatformFeature.AI_VOICE],
  'course-creation-learning-platform': [
    PlatformFeature.COURSE_BUILDER,
    PlatformFeature.COURSE_FACTORY,
    PlatformFeature.AI_CONTENT,
    PlatformFeature.LMS,
    PlatformFeature.CERTIFICATES,
  ],
  lms: [PlatformFeature.LMS, PlatformFeature.CERTIFICATES],
  'community-hub': [
    PlatformFeature.COMMUNITY,
    PlatformFeature.COMMUNITY_GROUPS,
    PlatformFeature.COMMUNITY_EVENTS,
    PlatformFeature.COMMUNITY_GAMIFICATION,
    PlatformFeature.COMMUNITY_MEMBERSHIPS,
  ],
  'course-builder': [PlatformFeature.COURSE_BUILDER],
  'ai-course-factory': [PlatformFeature.COURSE_FACTORY, PlatformFeature.COURSE_BUILDER, PlatformFeature.AI_CONTENT],
  sms: [PlatformFeature.SMS],
  'student-management': [PlatformFeature.STUDENT_MANAGEMENT],
  'workforce-development': [PlatformFeature.WORKFORCE],
  'apprenticeship-management': [PlatformFeature.APPRENTICESHIP],
  'employer-portal': [PlatformFeature.EMPLOYER_PORTAL],
  'testing-center': [PlatformFeature.TESTING_CENTER],
  'white-label-mobile': [PlatformFeature.WHITE_LABEL_MOBILE],
};

export function normalizeAddonCode(slugOrCode: string): string {
  return ADDON_SLUG_TO_CATALOG_CODE[slugOrCode] ?? slugOrCode;
}

export interface PlanLimits {
  users?: number;
  contacts?: number | null;
  locations?: number;
  storageGb?: number;
  automation?: boolean;
  custom_branding?: boolean;
}

/** Static plan feature sets (fallback when DB unavailable) */
export const PLAN_FEATURE_FALLBACK: Record<string, FeatureCode[]> = {
  solo: [
    FEATURES.CRM,
    FEATURES.WEBSITE,
    FEATURES.BOOKINGS,
    FEATURES.FORMS,
    FEATURES.EMAIL_MARKETING,
    FEATURES.AI_BASIC,
  ],
  business: [
    FEATURES.CRM,
    FEATURES.WEBSITE,
    FEATURES.BOOKINGS,
    FEATURES.FORMS,
    FEATURES.EMAIL_MARKETING,
    FEATURES.AI_BASIC,
    FEATURES.AUTOMATION,
    FEATURES.INVOICING,
    FEATURES.LEAD_FUNNELS,
    FEATURES.CLIENT_PORTAL,
    FEATURES.SMS,
  ],
  professional: [
    FEATURES.CRM,
    FEATURES.WEBSITE,
    FEATURES.BOOKINGS,
    FEATURES.FORMS,
    FEATURES.EMAIL_MARKETING,
    FEATURES.AI_BASIC,
    FEATURES.AUTOMATION,
    FEATURES.INVOICING,
    FEATURES.LEAD_FUNNELS,
    FEATURES.CLIENT_PORTAL,
    FEATURES.SMS,
    FEATURES.LMS,
    FEATURES.CERTIFICATES,
    FEATURES.WORKFLOW_AUTOMATION,
    FEATURES.REPORTING,
    FEATURES.CUSTOM_BRANDING,
  ],
};

export const PLAN_LIMITS_FALLBACK: Record<string, PlanLimits> = {
  solo: { users: 1, contacts: 100, locations: 1 },
  business: { users: 3, contacts: 5000, locations: 1, automation: true },
  professional: { users: 10, contacts: null, locations: 1, automation: true, custom_branding: true },
};
