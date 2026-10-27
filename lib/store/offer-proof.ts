import { PlatformFeature, type PlatformFeatureKey } from '@/lib/platform/features';

export type StoreProofAccess = 'public-demo' | 'public-product' | 'authenticated-workflow';

export type StoreFeatureProof = {
  title: string;
  claim: string;
  evidenceHref: string;
  evidenceLabel: string;
  access: StoreProofAccess;
  sourcePaths: readonly [string, ...string[]];
  limitation?: string;
};

export type StoreProductProof = {
  title: string;
  claim: string;
  evidenceHref: string;
  evidenceLabel: string;
  sourcePaths: readonly [string, ...string[]];
  limitation?: string;
};

/**
 * Source-backed evidence for every capability advertised by a public Store
 * plan, add-on, app, or marketplace card. The Store proof gate verifies that
 * every referenced implementation file exists before deployment.
 */
export const STORE_FEATURE_PROOFS: Partial<Record<PlatformFeatureKey, StoreFeatureProof>> = {
  [PlatformFeature.WEBSITE]: {
    title: 'Hosted website',
    claim: 'Renders tenant websites and stores from saved site configuration and branding.',
    evidenceHref: '/store/apps/website-builder',
    evidenceLabel: 'Review the Website Builder product',
    access: 'public-product',
    sourcePaths: ['components/tenant/PublicTenantSite.tsx'],
  },
  [PlatformFeature.WEBSITE_BUILDER]: {
    title: 'AI Website Builder',
    claim: 'Creates, edits, previews, saves, and publishes governed website drafts.',
    evidenceHref: '/store#website-builder-commercial',
    evidenceLabel: 'Use the public Website Builder demo',
    access: 'public-demo',
    sourcePaths: [
      'components/website-builder/AutonomousWebsiteBuilder.tsx',
      'apps/marketing/app/apps/website-builder/edit/[websiteId]/page.tsx',
      'apps/marketing/app/api/apps/website-builder/sites/route.ts',
      'apps/marketing/app/api/apps/website-builder/sites/[websiteId]/route.ts',
    ],
    limitation:
      'The public demo proves generation and publish intent. Persistent site creation, saving, domains, and live publishing require a signed-in account with Website Builder access.',
  },
  [PlatformFeature.CRM]: {
    title: 'CRM & Lead Management',
    claim: 'Provides lead, contact, deal, and pipeline workflows in the Admin application.',
    evidenceHref: '/store/demo/crm',
    evidenceLabel: 'Use the interactive CRM demo',
    access: 'public-demo',
    sourcePaths: ['apps/admin/app/crm/leads/page.tsx', 'apps/admin/app/crm/deals/page.tsx'],
  },
  [PlatformFeature.BOOKING]: {
    title: 'Booking & Scheduling',
    claim: 'Collects and validates public booking requests through the live booking flow.',
    evidenceHref: '/booking',
    evidenceLabel: 'Open the booking flow',
    access: 'public-product',
    sourcePaths: ['apps/marketing/app/booking/page.tsx', 'lib/testing/booking-validation.ts'],
  },
  [PlatformFeature.FORMS]: {
    title: 'Forms & Intake',
    claim: 'Publishes structured intake forms and routes submitted information into platform workflows.',
    evidenceHref: 'https://app.elevateforhumanity.org/forms',
    evidenceLabel: 'Open the forms workspace',
    access: 'authenticated-workflow',
    sourcePaths: ['apps/lms/app/forms/page.tsx', 'lib/forms/public-forms.ts'],
  },
  [PlatformFeature.EMAIL_MARKETING]: {
    title: 'Email Marketing',
    claim: 'Creates and manages campaigns through the Admin CRM campaign workspace.',
    evidenceHref: 'https://admin.elevateforhumanity.org/crm/campaigns',
    evidenceLabel: 'Open campaign management',
    access: 'authenticated-workflow',
    sourcePaths: [
      'apps/admin/app/crm/campaigns/page.tsx',
      'apps/admin/app/api/staff/campaigns/send/route.ts',
    ],
  },
  [PlatformFeature.AI_BASIC]: {
    title: 'Basic AI content generation',
    claim: 'Provides a governed assistant chat surface for guidance and content drafting.',
    evidenceHref: '/store/demos',
    evidenceLabel: 'Use the Store demo advisor',
    access: 'public-demo',
    sourcePaths: ['components/paris/ParisChat.tsx', 'apps/marketing/app/api/ai-chat/route.ts'],
  },
  [PlatformFeature.AUTOMATIONS]: {
    title: 'Automations',
    claim: 'Builds and manages email and operational automation workflows.',
    evidenceHref: 'https://admin.elevateforhumanity.org/email-marketing/automation',
    evidenceLabel: 'Open automation management',
    access: 'authenticated-workflow',
    sourcePaths: ['apps/admin/app/email-marketing/automation/page.tsx', 'lib/workflows/engine.ts'],
  },
  [PlatformFeature.INVOICING]: {
    title: 'Invoicing & Payments',
    claim: 'Creates and tracks billing invoices through the production billing workspace.',
    evidenceHref: 'https://admin.elevateforhumanity.org/billing/invoices',
    evidenceLabel: 'Open invoice management',
    access: 'authenticated-workflow',
    sourcePaths: [
      'apps/admin/app/billing/invoices/page.tsx',
      'apps/admin/app/api/admin/billing/invoices/route.ts',
    ],
  },
  [PlatformFeature.LEAD_FUNNELS]: {
    title: 'Lead funnels',
    claim: 'Moves leads through tracked CRM deal and opportunity stages.',
    evidenceHref: 'https://admin.elevateforhumanity.org/crm/deals',
    evidenceLabel: 'Open the CRM deal pipeline',
    access: 'authenticated-workflow',
    sourcePaths: ['apps/admin/app/crm/deals/page.tsx'],
  },
  [PlatformFeature.CLIENT_PORTAL]: {
    title: 'Client portal',
    claim: 'Resolves role-specific customer portals and routes signed-in users to the correct workspace.',
    evidenceHref: '/portals',
    evidenceLabel: 'Review available portals',
    access: 'public-product',
    sourcePaths: [
      'apps/marketing/app/portal/page.tsx',
      'apps/lms/app/api/auth/resolve-portal/route.ts',
    ],
  },
  [PlatformFeature.SMS]: {
    title: 'SMS Messaging',
    claim: 'Composes and records SMS outreach through the operations messaging workspace.',
    evidenceHref: 'https://admin.elevateforhumanity.org/operations/sms-logs',
    evidenceLabel: 'Open SMS operations',
    access: 'authenticated-workflow',
    sourcePaths: ['apps/admin/app/operations/sms-logs/SmsComposer.tsx', 'lib/notifications/sms.ts'],
    limitation: 'Carrier registration, provider usage, consent, and messaging-policy limits apply.',
  },
  [PlatformFeature.LMS]: {
    title: 'Learning Management System',
    claim: 'Delivers courses, lessons, quizzes, and learner progress through the LMS dashboard.',
    evidenceHref: '/store/demo/student',
    evidenceLabel: 'Use the interactive learner demo',
    access: 'public-demo',
    sourcePaths: ['apps/lms/app/lms/(app)/dashboard/page.tsx', 'lib/lms/dashboard-data.ts'],
  },
  [PlatformFeature.CERTIFICATES]: {
    title: 'Certificates',
    claim: 'Issues and verifies completion certificates using the certificate workflow.',
    evidenceHref: '/certificates',
    evidenceLabel: 'Open certificate verification',
    access: 'public-product',
    sourcePaths: ['lib/certificates/issue-certificate.ts', 'apps/marketing/app/certificates/page.tsx'],
  },
  [PlatformFeature.WORKFLOW_AUTOMATION]: {
    title: 'Workflow automation',
    claim: 'Executes registered, policy-controlled workflow actions and records their outcomes.',
    evidenceHref: 'https://admin.elevateforhumanity.org/workflows',
    evidenceLabel: 'Open the workflow workspace',
    access: 'authenticated-workflow',
    sourcePaths: ['lib/workflows/engine.ts', 'lib/workflows/action-policy.ts'],
  },
  [PlatformFeature.REPORTING]: {
    title: 'Reporting dashboard',
    claim: 'Provides operational, enrollment, workforce, and financial reporting views.',
    evidenceHref: '/store/demo/institutional',
    evidenceLabel: 'Use the institutional reporting demo',
    access: 'public-demo',
    sourcePaths: ['apps/admin/app/reports/page.tsx', 'lib/reporting/enterprise-dashboard.ts'],
  },
  [PlatformFeature.CUSTOM_BRANDING]: {
    title: 'Custom branding',
    claim: 'Applies saved tenant logos, colors, typography, and brand text to customer-facing sites.',
    evidenceHref: '/store/apps/website-builder',
    evidenceLabel: 'Review branded website output',
    access: 'public-product',
    sourcePaths: ['components/tenant/PublicTenantSite.tsx', 'lib/licensing/tenant-context.tsx'],
  },
  [PlatformFeature.AI_ADVANCED]: {
    title: 'Advanced AI generation',
    claim: 'Routes structured AI tasks through the shared task orchestration layer.',
    evidenceHref: '/store/ai-assistants',
    evidenceLabel: 'Review AI assistant capabilities',
    access: 'public-product',
    sourcePaths: ['lib/ai/task-orchestrator.ts', 'lib/ai/tools/registry.ts'],
  },
  [PlatformFeature.AI_CONTENT]: {
    title: 'AI content tools',
    claim: 'Generates governed lesson and curriculum content with validation and persistence checkpoints.',
    evidenceHref: '/store/course-builder',
    evidenceLabel: 'Review the Course Builder workflow',
    access: 'public-product',
    sourcePaths: ['lib/course-factory/content-generator.ts', 'lib/course-factory/validator.ts'],
  },
  [PlatformFeature.AI_CHAT_WIDGET]: {
    title: 'AI chat widget',
    claim: 'Embeds an interactive assistant widget with governed message routing.',
    evidenceHref: '/store/demos',
    evidenceLabel: 'Use the embedded Store advisor',
    access: 'public-demo',
    sourcePaths: ['components/chat/SuperChatWidget.tsx', 'components/paris/ParisChat.tsx'],
  },
  [PlatformFeature.AI_PARIS]: {
    title: 'PARIS — Sales & Intake Assistant',
    claim: 'Provides conversational intake, platform guidance, and approved lead-routing actions.',
    evidenceHref: '/store/demos',
    evidenceLabel: 'Use PARIS in the demo center',
    access: 'public-demo',
    sourcePaths: ['components/paris/ParisChat.tsx', 'lib/ai/intent-router.ts'],
  },
  [PlatformFeature.AI_ELLIE]: {
    title: 'ELLIE — Learning & Support Assistant',
    claim: 'Routes learning and course-support requests through governed ELLIE actions.',
    evidenceHref: 'https://admin.elevateforhumanity.org/studio',
    evidenceLabel: 'Open the authenticated Studio',
    access: 'authenticated-workflow',
    sourcePaths: ['lib/ellie/executor.ts', 'lib/ellie/actions.ts'],
  },
  [PlatformFeature.AI_LIZZY]: {
    title: 'LIZZY — Operations Assistant',
    claim: 'Runs administrative and operations tasks through the unified governed Studio runtime.',
    evidenceHref: 'https://admin.elevateforhumanity.org/studio',
    evidenceLabel: 'Open the authenticated Studio',
    access: 'authenticated-workflow',
    sourcePaths: ['components/studio/UnifiedEllieChat.tsx', 'lib/ai/tools/registry.ts'],
  },
  [PlatformFeature.AI_ZORA]: {
    title: 'ZORA — Compliance Assistant',
    claim: 'Applies documented compliance rules and evidence-oriented review workflows.',
    evidenceHref: '/store/compliance',
    evidenceLabel: 'Review compliance workflows',
    access: 'public-product',
    sourcePaths: ['lib/zora/admissions/orchestration-service.ts', 'lib/ai/tools/registry.ts'],
    limitation: 'Provides workflow assistance and evidence review, not legal or regulatory approval.',
  },
  [PlatformFeature.AI_ORCHESTRATOR]: {
    title: 'AI Team Orchestrator',
    claim: 'Routes supported tasks to the assistant and tool policy authorized for that task.',
    evidenceHref: '/store/ai-assistants',
    evidenceLabel: 'Review the AI team',
    access: 'public-product',
    sourcePaths: ['lib/ai/task-orchestrator.ts', 'lib/ai/tools/registry.ts'],
    limitation: 'Enterprise configuration controls which assistants and actions are enabled.',
  },
  [PlatformFeature.AI_VOICE]: {
    title: 'AI Voice',
    claim: 'Accepts browser speech input and produces spoken responses on supported assistant surfaces.',
    evidenceHref: '/store/demos',
    evidenceLabel: 'Try voice in the Store advisor',
    access: 'public-demo',
    sourcePaths: ['components/voice/useNaturalVoice.ts', 'components/paris/ParisChat.tsx'],
    limitation: 'Browser support, microphone permission, and provider usage limits apply.',
  },
  [PlatformFeature.COURSE_BUILDER]: {
    title: 'Course Builder',
    claim: 'Creates and manages course structures, modules, lessons, assessments, and publishing state.',
    evidenceHref: '/store/course-builder',
    evidenceLabel: 'Review the Course Builder product',
    access: 'public-product',
    sourcePaths: ['apps/admin/app/studio/courses/page.tsx', 'lib/course-builder/orchestrator.ts'],
  },
  [PlatformFeature.COURSE_FACTORY]: {
    title: 'AI Course Factory',
    claim: 'Generates governed course blueprints, lessons, and assessments through staged validation.',
    evidenceHref: '/store/course-builder',
    evidenceLabel: 'Review the AI course workflow',
    access: 'public-product',
    sourcePaths: ['lib/course-factory/factory.ts', 'lib/course-factory/canonical-course-gate.ts'],
  },
  [PlatformFeature.STUDENT_MANAGEMENT]: {
    title: 'Student Management',
    claim: 'Tracks learner records, enrollment, attendance, and progress in the Admin workspace.',
    evidenceHref: '/store/demo/admin',
    evidenceLabel: 'Use the interactive Admin demo',
    access: 'public-demo',
    sourcePaths: ['apps/admin/app/students/page.tsx', 'lib/lms/dashboard-data.ts'],
  },
  [PlatformFeature.WORKFORCE]: {
    title: 'Workforce Development',
    claim: 'Connects participant, eligibility, funding, activity, and outcome workflows.',
    evidenceHref: '/store/demo/institutional',
    evidenceLabel: 'Use the workforce demo',
    access: 'public-demo',
    sourcePaths: ['apps/lms/app/workforce/dashboard/page.tsx', 'lib/workflow/case-management.ts'],
  },
  [PlatformFeature.APPRENTICESHIP]: {
    title: 'Apprenticeship Management',
    claim: 'Tracks apprenticeships, host employers, RTI, OJT, submitted hours, and approvals.',
    evidenceHref: '/store/demo/employer',
    evidenceLabel: 'Use the employer and apprenticeship demo',
    access: 'public-demo',
    sourcePaths: [
      'apps/admin/app/apprenticeships/page.tsx',
      'apps/admin/app/api/admin/apprenticeships/hours/approve/route.ts',
    ],
  },
  [PlatformFeature.EMPLOYER_PORTAL]: {
    title: 'Employer Portal',
    claim: 'Gives employers authenticated access to jobs, candidates, apprenticeships, and workforce requests.',
    evidenceHref: '/store/demo/employer',
    evidenceLabel: 'Use the interactive employer demo',
    access: 'public-demo',
    sourcePaths: ['apps/lms/app/employer/dashboard/page.tsx', 'apps/lms/app/employer/apprenticeships/page.tsx'],
  },
  [PlatformFeature.TESTING_CENTER]: {
    title: 'Credential Testing Center',
    claim: 'Publishes testing options and supports booking, pricing, proctoring, and result workflows.',
    evidenceHref: '/store/testing',
    evidenceLabel: 'Review the Testing Center',
    access: 'public-product',
    sourcePaths: ['components/testing/TestingCenter.tsx', 'lib/testing/booking-validation.ts'],
  },
  [PlatformFeature.SEO_AUTOPILOT]: {
    title: 'SEO Autopilot',
    claim: 'Audits indexability and manages governed SEO metadata and structured-data workflows.',
    evidenceHref: '/store/demo/capability/seo_autopilot',
    evidenceLabel: 'Review the SEO beta tour',
    access: 'public-demo',
    sourcePaths: ['apps/admin/app/governance/seo-indexing/page.tsx', 'lib/seo/indexing-governance.ts'],
    limitation: 'Beta: automated optimization remains limited while the capability is finalized.',
  },
  [PlatformFeature.MARKETING_AUTOPILOT]: {
    title: 'Marketing Autopilot',
    claim: 'Builds assisted campaign and follow-up automations on the communications workflow stack.',
    evidenceHref: '/store/demo/capability/marketing_autopilot',
    evidenceLabel: 'Review the marketing beta tour',
    access: 'public-demo',
    sourcePaths: [
      'apps/admin/app/email-marketing/automation/page.tsx',
      'apps/admin/app/email-marketing/automation/new/NewAutomationClient.tsx',
    ],
    limitation: 'Beta: available automation actions depend on configured messaging providers.',
  },
  [PlatformFeature.COMPLIANCE]: {
    title: 'Compliance & Audit',
    claim: 'Tracks audit evidence, standards, workforce documentation, and compliance review status.',
    evidenceHref: '/store/compliance',
    evidenceLabel: 'Review compliance modules and limits',
    access: 'public-product',
    sourcePaths: ['apps/admin/app/compliance-audit/page.tsx', 'components/admin/WIOAComplianceDashboard.tsx'],
    limitation: 'Managed workflow support; it does not replace legal advice or regulator approval.',
  },
  [PlatformFeature.SAM_GOV_MANAGER]: {
    title: 'SAM.gov Manager',
    claim: 'Organizes entity records, supporting documents, reminders, and supported UEI lookup workflows.',
    evidenceHref: '/store/apps/sam-gov',
    evidenceLabel: 'Review the SAM.gov Manager',
    access: 'public-product',
    sourcePaths: ['apps/marketing/app/apps/sam-gov/SamGovApp.tsx', 'lib/integrations/sam-gov.ts'],
    limitation: 'Official registration and approval remain in SAM.gov.',
  },
  [PlatformFeature.GRANTS_DISCOVERY]: {
    title: 'Grants Discovery',
    claim: 'Searches supported grant sources and organizes saved opportunities and application work.',
    evidenceHref: '/store/apps/grants',
    evidenceLabel: 'Review Grants Discovery',
    access: 'public-product',
    sourcePaths: ['apps/admin/app/grants/opportunities/page.tsx', 'lib/integrations/grants-gov.ts'],
    limitation: 'Availability and accuracy depend on the connected authoritative grant source.',
  },
  [PlatformFeature.DEV_STUDIO]: {
    title: 'Dev Studio',
    claim: 'Provides authenticated project, workflow, build, container, browser, and diagnostics workspaces.',
    evidenceHref: '/store/dev-studio',
    evidenceLabel: 'Review Dev Studio scope',
    access: 'public-product',
    sourcePaths: ['apps/admin/app/studio/browser/page.tsx', 'apps/admin/app/studio/workflows/new/PageClient.tsx'],
    limitation: 'Enterprise access is scoped and controlled; execution requires configured infrastructure.',
  },
};

export const STORE_PRODUCT_PROOFS = {
  'additional-user': {
    title: 'Additional User',
    claim: 'Raises the organization user limit by one licensed seat after entitlement activation.',
    evidenceHref: '/store/plans',
    evidenceLabel: 'Review plan capacity',
    sourcePaths: ['lib/platform/organization-features.ts'],
  },
  'additional-location': {
    title: 'Additional Location',
    claim: 'Raises the organization location limit by one after entitlement activation.',
    evidenceHref: '/store/plans',
    evidenceLabel: 'Review plan capacity',
    sourcePaths: ['lib/platform/organization-features.ts'],
  },
  'additional-storage': {
    title: 'Additional Storage',
    claim: 'Raises the organization storage limit by 100 GB after entitlement activation.',
    evidenceHref: '/store/plans',
    evidenceLabel: 'Review plan capacity',
    sourcePaths: ['lib/platform/organization-features.ts'],
  },
  'standalone-platform-builds': {
    title: 'Standalone platform builds',
    claim: 'Uses defined implementation packages, deliverables, acceptance scope, and payment milestones.',
    evidenceHref: '/store/implementation-packages',
    evidenceLabel: 'Review implementation packages',
    sourcePaths: ['lib/store/implementation-packages.ts', 'components/store/StandaloneBuildPackages.tsx'],
    limitation: 'A signed scope and required customer materials are required before delivery.',
  },
  'ai-studio': {
    title: 'AI Studio',
    claim: 'Provides authenticated content, media, course, and assistant production workspaces.',
    evidenceHref: '/store/ai-studio',
    evidenceLabel: 'Review AI Studio scope',
    sourcePaths: ['components/studio/MediaStudioPanel.tsx', 'apps/admin/app/studio/content/page.tsx'],
    limitation: 'Generation capacity depends on licensed providers and configured credits.',
  },
  integrations: {
    title: 'Integrations',
    claim: 'Implements provider adapters and runtime status checks for supported external systems.',
    evidenceHref: '/store/integrations',
    evidenceLabel: 'Review supported integrations',
    sourcePaths: ['lib/integrations/runtime-status.ts', 'components/studio/IntegrationsPanel.tsx'],
    limitation: 'Only integrations listed as supported and configured for the customer are included.',
  },
  'platform-licensing': {
    title: 'Platform licensing',
    claim: 'Routes managed and source-use licensing through defined license scope and provisioning workflows.',
    evidenceHref: '/store/licenses',
    evidenceLabel: 'Review licensing options',
    sourcePaths: ['lib/store/license.ts', 'apps/admin/app/license-requests/page.tsx'],
    limitation: 'Licenses require contract and procurement review; they are not instant self-service products.',
  },
  'course-licensing': {
    title: 'Course licensing',
    claim: 'Publishes concrete course-license deliverables and routes licensing through the managed contract flow.',
    evidenceHref: '/store/courses',
    evidenceLabel: 'Review licensable courses',
    sourcePaths: ['apps/marketing/app/store/courses/page.tsx', 'lib/media/licensed-course-media.ts'],
    limitation: 'Only the courses and usage rights named in the executed license are included.',
  },
} as const satisfies Record<string, StoreProductProof>;

export type StoreProductProofId = keyof typeof STORE_PRODUCT_PROOFS;

export function getStoreFeatureProof(key: PlatformFeatureKey): StoreFeatureProof | null {
  return STORE_FEATURE_PROOFS[key] ?? null;
}
