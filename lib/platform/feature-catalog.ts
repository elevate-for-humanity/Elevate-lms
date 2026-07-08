/**
 * Canonical SaaS feature and add-on catalog (Phase 1).
 * DB source of truth after migration 20260702000017; code mirrors for offline/fallback.
 */

export const FEATURES = {
  CRM: 'crm',
  WEBSITE: 'website',
  BOOKINGS: 'bookings',
  FORMS: 'forms',
  EMAIL_MARKETING: 'email_marketing',
  AI_BASIC: 'ai_basic',
  AI: 'ai',
  SMS: 'sms',
  AUTOMATION: 'automation',
  INVOICING: 'invoicing',
  LEAD_FUNNELS: 'lead_funnels',
  CLIENT_PORTAL: 'client_portal',
  LMS: 'lms',
  CERTIFICATES: 'certificates',
  WORKFLOW_AUTOMATION: 'workflow_automation',
  REPORTING: 'reporting',
  CUSTOM_BRANDING: 'custom_branding',
  STUDENT_MANAGEMENT: 'student_management',
  WORKFORCE: 'workforce',
  APPRENTICESHIP: 'apprenticeship',
  EMPLOYER_PORTAL: 'employer_portal',
  TESTING_CENTER: 'testing_center',
  WHITE_LABEL_MOBILE: 'white_label_mobile',
  API_ACCESS: 'api_access',
} as const;

export type FeatureCode = (typeof FEATURES)[keyof typeof FEATURES];

/** Monthly add-on prices (USD) — mirror saas_addon_catalog seed */
export const ADDONS = {
  LMS: 29,
  AI_ASSISTANT: 19,
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

/** Checkout slug (store) → DB addon code */
export const ADDON_SLUG_TO_CATALOG_CODE: Record<string, string> = {
  'ai-addon': 'ai-assistant',
  'online-courses-lms': 'lms',
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

export function normalizeAddonCode(slugOrCode: string): string {
  return ADDON_SLUG_TO_CATALOG_CODE[slugOrCode] ?? slugOrCode;
}

export interface PlanLimits {
  users?: number;
  contacts?: number | null;
  locations?: number;
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
