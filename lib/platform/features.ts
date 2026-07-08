/**
 * Platform feature keys for plan + add-on entitlements.
 * Stored on licenses.features (text[]) and checked via hasPlatformFeature().
 */

export const PlatformFeature = {
  CRM: 'crm',
  WEBSITE: 'website',
  BOOKING: 'booking',
  FORMS: 'forms',
  EMAIL_MARKETING: 'email_marketing',
  AI_BASIC: 'ai_basic',
  AI_ADVANCED: 'ai_advanced',
  AI_CONTENT: 'ai_content',
  AI_CHAT_WIDGET: 'ai_chat_widget',
  SMS: 'sms',
  AUTOMATIONS: 'automations',
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
} as const;

export type PlatformFeatureKey = (typeof PlatformFeature)[keyof typeof PlatformFeature];

export const ALL_PLATFORM_FEATURE_KEYS: PlatformFeatureKey[] = Object.values(PlatformFeature);
