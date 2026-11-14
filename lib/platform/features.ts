/**
 * Canonical platform capability keys.
 *
 * These keys are shared by Marketing, LMS, Admin, Store, Stripe fulfillment,
 * licenses, organization subscriptions and feature gates. Add new commercial
 * capabilities here first so every application speaks the same entitlement language.
 */

export const PlatformFeature = {
  // Core business platform
  CRM: 'crm',
  WEBSITE: 'website',
  WEBSITE_BUILDER: 'website_builder',
  WEBSITE_IMPORT: 'website_import',
  CUSTOM_DOMAIN: 'custom_domain',
  BOOKING: 'booking',
  FORMS: 'forms',
  EMAIL_MARKETING: 'email_marketing',
  SMS: 'sms',
  AUTOMATIONS: 'automations',
  INVOICING: 'invoicing',
  LEAD_FUNNELS: 'lead_funnels',
  CLIENT_PORTAL: 'client_portal',
  ANALYTICS: 'analytics',
  SEO_AUTOPILOT: 'seo_autopilot',
  MARKETING_AUTOPILOT: 'marketing_autopilot',

  // AI platform / virtual workforce
  AI_BASIC: 'ai_basic',
  AI_ADVANCED: 'ai_advanced',
  AI_CONTENT: 'ai_content',
  AI_CHAT_WIDGET: 'ai_chat_widget',
  AI_PARIS: 'ai_paris',
  AI_ELLIE: 'ai_ellie',
  AI_LIZZY: 'ai_lizzy',
  AI_ZORA: 'ai_zora',
  AI_ORCHESTRATOR: 'ai_orchestrator',
  AI_VOICE: 'ai_voice',

  // Education / creator platform
  LMS: 'lms',
  COURSE_BUILDER: 'course_builder',
  COURSE_FACTORY: 'course_factory',
  CERTIFICATES: 'certificates',
  CREDENTIALS: 'credentials',
  STUDENT_MANAGEMENT: 'student_management',
  INSTRUCTOR_TOOLS: 'instructor_tools',
  MEDIA_STUDIO: 'media_studio',

  // Community / memberships
  COMMUNITY: 'community',
  COMMUNITY_GROUPS: 'community_groups',
  COMMUNITY_EVENTS: 'community_events',
  COMMUNITY_GAMIFICATION: 'community_gamification',
  COMMUNITY_MEMBERSHIPS: 'community_memberships',

  // Workforce / regulated operations
  WORKFORCE: 'workforce',
  APPRENTICESHIP: 'apprenticeship',
  EMPLOYER_PORTAL: 'employer_portal',
  TESTING_CENTER: 'testing_center',
  COMPLIANCE: 'compliance',
  REPORTING: 'reporting',
  WORKFLOW_AUTOMATION: 'workflow_automation',

  // Individual business apps
  SAM_GOV_MANAGER: 'sam_gov_manager',
  GRANTS_DISCOVERY: 'grants_discovery',

  // Enterprise / platform operations
  CUSTOM_BRANDING: 'custom_branding',
  WHITE_LABEL_MOBILE: 'white_label_mobile',
  API_ACCESS: 'api_access',
  DEV_STUDIO: 'dev_studio',
  DEPLOYMENT_AUTOPILOT: 'deployment_autopilot',
  CONTAINER_MANAGEMENT: 'container_management',
} as const;

export type PlatformFeatureKey = (typeof PlatformFeature)[keyof typeof PlatformFeature];

export const ALL_PLATFORM_FEATURE_KEYS: PlatformFeatureKey[] = Object.values(PlatformFeature);
