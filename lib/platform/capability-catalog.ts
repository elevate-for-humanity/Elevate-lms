import { PlatformFeature, type PlatformFeatureKey } from '@/lib/platform/features';

export type CapabilityStatus = 'sell_now' | 'repair' | 'enterprise' | 'internal';
export type CapabilityCategory =
  | 'business'
  | 'ai'
  | 'education'
  | 'workforce'
  | 'compliance'
  | 'apps'
  | 'enterprise';

export type PlatformCapability = {
  key: PlatformFeatureKey;
  name: string;
  category: CapabilityCategory;
  description: string;
  status: CapabilityStatus;
  marketingHref?: string;
  appHref?: string;
  adminHref?: string;
  demoHref?: string;
  storeHref?: string;
  keywords: string[];
  upsells?: PlatformFeatureKey[];
};

/**
 * One source of truth for what Elevate actually exposes across Marketing, LMS,
 * Admin and Store. Pricing remains in the relevant billing catalog; this file
 * owns naming, routes, sales grouping and cross-sell relationships.
 */
export const CAPABILITY_CATALOG: PlatformCapability[] = [
  {
    key: PlatformFeature.WEBSITE_BUILDER,
    name: 'AI Website Builder',
    category: 'business',
    description: 'Create, import, edit, save and publish business websites with Elevate hosting and upgrade paths.',
    status: 'sell_now',
    marketingHref: '/apps/website-builder',
    appHref: '/apps/website-builder',
    storeHref: '/store/apps/website-builder',
    demoHref: '/store/apps/website-builder',
    keywords: ['website', 'builder', 'site', 'import', 'publish', 'domain', 'ai'],
    upsells: [PlatformFeature.AI_PARIS, PlatformFeature.SEO_AUTOPILOT, PlatformFeature.CRM, PlatformFeature.BOOKING],
  },
  {
    key: PlatformFeature.CRM,
    name: 'CRM & Lead Management',
    category: 'business',
    description: 'Capture leads, manage contacts, score opportunities and move prospects through a sales pipeline.',
    status: 'sell_now',
    adminHref: '/crm',
    keywords: ['crm', 'leads', 'contacts', 'pipeline', 'sales'],
    upsells: [PlatformFeature.AI_PARIS, PlatformFeature.EMAIL_MARKETING, PlatformFeature.SMS, PlatformFeature.AUTOMATIONS],
  },
  {
    key: PlatformFeature.BOOKING,
    name: 'Booking & Scheduling',
    category: 'business',
    description: 'Appointment scheduling integrated with websites, lead capture and customer workflows.',
    status: 'sell_now',
    keywords: ['booking', 'appointments', 'calendar', 'scheduling'],
    upsells: [PlatformFeature.CRM, PlatformFeature.SMS, PlatformFeature.AI_PARIS],
  },
  {
    key: PlatformFeature.FORMS,
    name: 'Forms & Intake',
    category: 'business',
    description: 'Capture inquiries, applications and structured intake data directly into platform workflows.',
    status: 'sell_now',
    keywords: ['forms', 'intake', 'applications', 'lead capture'],
    upsells: [PlatformFeature.CRM, PlatformFeature.AUTOMATIONS, PlatformFeature.AI_PARIS],
  },
  {
    key: PlatformFeature.EMAIL_MARKETING,
    name: 'Email Marketing',
    category: 'business',
    description: 'Campaigns and transactional email integrated with customer, learner and prospect records.',
    status: 'sell_now',
    adminHref: '/crm/campaigns',
    keywords: ['email', 'campaign', 'marketing', 'sendgrid'],
    upsells: [PlatformFeature.CRM, PlatformFeature.AUTOMATIONS, PlatformFeature.MARKETING_AUTOPILOT],
  },
  {
    key: PlatformFeature.SMS,
    name: 'SMS Messaging',
    category: 'business',
    description: 'Text alerts, reminders and outreach tied to customer and learner workflows.',
    status: 'sell_now',
    keywords: ['sms', 'text', 'twilio', 'reminders'],
    upsells: [PlatformFeature.CRM, PlatformFeature.AUTOMATIONS],
  },
  {
    key: PlatformFeature.INVOICING,
    name: 'Invoicing & Payments',
    category: 'business',
    description: 'Invoices, payment records and Stripe-backed commerce workflows.',
    status: 'sell_now',
    adminHref: '/billing/invoices',
    keywords: ['invoice', 'payments', 'stripe', 'billing'],
  },
  {
    key: PlatformFeature.SEO_AUTOPILOT,
    name: 'SEO Autopilot',
    category: 'business',
    description: 'Automated SEO checks and optimization workflows for pages, metadata and discoverability.',
    status: 'repair',
    keywords: ['seo', 'search', 'google', 'bing', 'metadata', 'schema'],
    upsells: [PlatformFeature.WEBSITE_BUILDER, PlatformFeature.MARKETING_AUTOPILOT, PlatformFeature.AI_CONTENT],
  },
  {
    key: PlatformFeature.MARKETING_AUTOPILOT,
    name: 'Marketing Autopilot',
    category: 'business',
    description: 'AI-assisted content, campaign and conversion workflows built on the automation and communications stack.',
    status: 'repair',
    keywords: ['marketing', 'autopilot', 'campaigns', 'content', 'conversion'],
  },
  {
    key: PlatformFeature.AI_PARIS,
    name: 'PARIS — Sales & Intake Assistant',
    category: 'ai',
    description: 'Conversational admissions, intake, eligibility and lead-qualification assistant.',
    status: 'sell_now',
    keywords: ['paris', 'sales', 'admissions', 'interview', 'intake', 'qualification'],
    upsells: [PlatformFeature.AI_VOICE, PlatformFeature.CRM, PlatformFeature.AUTOMATIONS],
  },
  {
    key: PlatformFeature.AI_ELLIE,
    name: 'ELLIE — Learning & Support Assistant',
    category: 'ai',
    description: 'Student success, enrollment support, course guidance and learning assistance.',
    status: 'sell_now',
    keywords: ['ellie', 'student', 'support', 'learning', 'course'],
  },
  {
    key: PlatformFeature.AI_LIZZY,
    name: 'LIZZY — Operations Assistant',
    category: 'ai',
    description: 'Operations automation, document processing, administrative work and queue management.',
    status: 'sell_now',
    keywords: ['lizzy', 'operations', 'documents', 'admin', 'workflow'],
  },
  {
    key: PlatformFeature.AI_ZORA,
    name: 'ZORA — Compliance Assistant',
    category: 'ai',
    description: 'Compliance monitoring, workforce reporting, credential tracking and regulatory review.',
    status: 'sell_now',
    keywords: ['zora', 'compliance', 'wioa', 'credentials', 'audit'],
  },
  {
    key: PlatformFeature.AI_ORCHESTRATOR,
    name: 'AI Team Orchestrator',
    category: 'ai',
    description: 'Routes work across specialized assistants and platform AI task types.',
    status: 'enterprise',
    keywords: ['orchestrator', 'agents', 'ai team', 'automation'],
  },
  {
    key: PlatformFeature.COURSE_BUILDER,
    name: 'Course Builder',
    category: 'education',
    description: 'Create and manage course structures, curriculum and learning content.',
    status: 'sell_now',
    appHref: '/builder',
    adminHref: '/curriculum',
    marketingHref: '/course-factory',
    keywords: ['course builder', 'curriculum', 'lessons', 'education'],
    upsells: [PlatformFeature.COURSE_FACTORY, PlatformFeature.AI_ELLIE, PlatformFeature.MEDIA_STUDIO],
  },
  {
    key: PlatformFeature.COURSE_FACTORY,
    name: 'AI Course Factory',
    category: 'education',
    description: 'Generate course blueprints, lessons and assessments through the shared AI orchestration layer.',
    status: 'sell_now',
    appHref: '/ai/course-factory',
    marketingHref: '/ai/course-factory',
    keywords: ['course factory', 'ai course', 'lesson generator', 'quiz generator'],
  },
  {
    key: PlatformFeature.LMS,
    name: 'Learning Management System',
    category: 'education',
    description: 'Deliver programs, lessons, quizzes, learner progress and certificates.',
    status: 'sell_now',
    appHref: 'https://app.elevateforhumanity.org/lms/dashboard',
    keywords: ['lms', 'courses', 'students', 'lessons', 'quizzes'],
  },
  {
    key: PlatformFeature.STUDENT_MANAGEMENT,
    name: 'Student Management',
    category: 'education',
    description: 'Enrollment, attendance, progress and student administration.',
    status: 'sell_now',
    adminHref: '/students',
    keywords: ['students', 'enrollment', 'attendance', 'progress'],
  },
  {
    key: PlatformFeature.TESTING_CENTER,
    name: 'Credential Testing Center',
    category: 'education',
    description: 'Testing appointments, sessions, results, pricing and credential operations.',
    status: 'sell_now',
    marketingHref: '/testing',
    adminHref: '/testing',
    keywords: ['testing', 'proctor', 'exam', 'credentials', 'appointments'],
  },
  {
    key: PlatformFeature.WORKFORCE,
    name: 'Workforce Development',
    category: 'workforce',
    description: 'Workforce case management, funding workflows and outcome reporting.',
    status: 'sell_now',
    keywords: ['workforce', 'wioa', 'snap et', 'case management', 'outcomes'],
    upsells: [PlatformFeature.COMPLIANCE, PlatformFeature.AI_ZORA, PlatformFeature.EMPLOYER_PORTAL],
  },
  {
    key: PlatformFeature.APPRENTICESHIP,
    name: 'Apprenticeship Management',
    category: 'workforce',
    description: 'Apprentices, host shops, employers, OJT and hour verification workflows.',
    status: 'sell_now',
    adminHref: '/apprenticeships',
    keywords: ['apprenticeship', 'ojt', 'hours', 'host shop', 'rapids'],
  },
  {
    key: PlatformFeature.EMPLOYER_PORTAL,
    name: 'Employer Portal',
    category: 'workforce',
    description: 'Employer-facing jobs, candidates, apprenticeship and workforce-request workflows.',
    status: 'sell_now',
    keywords: ['employer', 'jobs', 'candidates', 'workforce'],
  },
  {
    key: PlatformFeature.COMPLIANCE,
    name: 'Compliance & Audit',
    category: 'compliance',
    description: 'Compliance dashboard, audit logs, accreditation tracking and reporting. Available through managed/enterprise scope until a dedicated self-service entitlement is packaged.',
    status: 'enterprise',
    adminHref: '/compliance',
    keywords: ['compliance', 'audit', 'accreditation', 'reporting'],
    upsells: [PlatformFeature.AI_ZORA, PlatformFeature.REPORTING],
  },
  {
    key: PlatformFeature.SAM_GOV_MANAGER,
    name: 'SAM.gov Manager',
    category: 'apps',
    description: 'Entity records, documents, alerts and federal-registration workflow support.',
    status: 'sell_now',
    marketingHref: '/apps/sam-gov',
    appHref: '/apps/sam-gov',
    storeHref: '/store/apps/sam-gov',
    keywords: ['sam.gov', 'federal contracting', 'uei', 'cage'],
  },
  {
    key: PlatformFeature.GRANTS_DISCOVERY,
    name: 'Grants Discovery',
    category: 'apps',
    description: 'Grant opportunities, saved grants and application workflow management.',
    status: 'sell_now',
    marketingHref: '/apps/grants',
    appHref: '/apps/grants',
    storeHref: '/store/apps/grants',
    keywords: ['grants', 'funding', 'opportunities', 'applications'],
  },
  {
    key: PlatformFeature.DEV_STUDIO,
    name: 'Dev Studio',
    category: 'enterprise',
    description: 'AI-assisted platform engineering, diagnostics and controlled execution workflows.',
    status: 'enterprise',
    adminHref: '/admin/dev-studio',
    keywords: ['dev studio', 'developer', 'diagnostics', 'execution'],
  },
  {
    key: PlatformFeature.DEPLOYMENT_AUTOPILOT,
    name: 'Deployment Autopilot',
    category: 'enterprise',
    description: 'Deployment, health, monitoring, rollback and operational automation tooling.',
    status: 'internal',
    keywords: ['deployment', 'autopilot', 'northflank', 'rollback', 'monitoring'],
  },
];

export function getCapability(key: PlatformFeatureKey): PlatformCapability | undefined {
  return CAPABILITY_CATALOG.find((capability) => capability.key === key);
}

export function getSellableCapabilities(): PlatformCapability[] {
  return CAPABILITY_CATALOG.filter((capability) => capability.status === 'sell_now' || capability.status === 'enterprise');
}

export function searchCapabilities(query: string): PlatformCapability[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return getSellableCapabilities();
  return getSellableCapabilities().filter((capability) =>
    [capability.name, capability.description, ...capability.keywords]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  );
}
