/**
 * CANONICAL PRICING SOURCE
 * 
 * All pricing, licensing, and product data must be imported from this file.
 * DO NOT hardcode pricing elsewhere in the codebase.
 * 
 * EVIDENCE SOURCES:
 * - app/data/store-products.ts (primary, has Stripe integration)
 * - lib/store/digital-products.ts (digital products)
 * 
 * Last reconciled: January 2026
 */

// ============================================
// LICENSE TIERS
// ============================================

export interface LicenseTier {
  id: string;
  name: string;
  price: string;
  priceNumeric: number | null;
  billingType: 'one-time' | 'subscription' | 'custom';
  description: string;
  includes: string[];
  idealFor: string[];
  featured?: boolean;
  source: string;
}

export const LICENSE_TIERS: LicenseTier[] = [
  {
    id: 'core',
    name: 'Core Platform',
    price: '$4,999',
    priceNumeric: 4999,
    billingType: 'one-time',
    description: 'Full workforce-ready LMS for single-site deployment.',
    includes: [
      'Unlimited students and courses',
      'LMS, enrollment, admin, payments',
      'Mobile-responsive design',
      'Progress tracking and certificates',
      '1 year of updates and support',
    ],
    idealFor: [
      'Small training providers',
      'Nonprofits starting workforce programs',
      'Pilot programs',
    ],
    source: 'app/data/store-products.ts:117',
  },
  {
    id: 'school',
    name: 'School / Training Provider',
    price: '$15,000',
    priceNumeric: 15000,
    billingType: 'one-time',
    description: 'White-label license with compliance tools for training providers.',
    includes: [
      'Everything in Core Platform',
      'White-label branding',
      'Partner dashboard for instructors',
      'Case management tools',
      'WIOA/grant compliance reporting',
      'Lifetime updates',
    ],
    idealFor: [
      'Community colleges',
      'Workforce development boards',
      'Training providers with WIOA contracts',
    ],
    featured: true,
    source: 'app/data/store-products.ts:145',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Solution',
    price: '$50,000',
    priceNumeric: 50000,
    billingType: 'one-time',
    description: 'Full enterprise deployment with employer portal and AI tutor.',
    includes: [
      'Everything in School License',
      'Employer portal and job matching',
      'AI tutor and personalized learning',
      'Custom integrations (API access)',
      'Multi-tenant architecture',
      'Dedicated account manager',
    ],
    idealFor: [
      'State workforce agencies',
      'Large workforce boards',
      'Multi-state training networks',
    ],
    source: 'app/data/store-products.ts:175',
  },
  {
    id: 'monthly',
    name: 'Monthly Subscription',
    price: '$499/month',
    priceNumeric: 499,
    billingType: 'subscription',
    description: 'Pay-as-you-go access with no upfront cost.',
    includes: [
      'All core platform features',
      'Up to 100 active students',
      'Basic support',
      'Monthly updates',
      'Cancel anytime',
    ],
    idealFor: [
      'New training providers testing the platform',
      'Seasonal programs',
      'Budget-conscious organizations',
    ],
    source: 'app/data/store-products.ts:205',
  },
];

// ============================================
// DIGITAL PRODUCTS
// ============================================

export interface DigitalProduct {
  id: string;
  name: string;
  price: string;
  priceInCents: number;
  benefit: string;
  checkoutReady: boolean;
  source: string;
}

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  {
    id: 'tax-toolkit',
    name: 'Start a Tax Business Toolkit',
    price: '$49',
    priceInCents: 4900,
    benefit: 'Step-by-step toolkit with templates, checklists, and marketing materials to launch your tax business.',
    checkoutReady: false,
    source: 'lib/store/digital-products.ts:36',
  },
  {
    id: 'grant-guide',
    name: 'Grant Readiness Guide',
    price: '$29',
    priceInCents: 2900,
    benefit: 'Complete guide to grant applications, compliance requirements, and funding preparation.',
    checkoutReady: false,
    source: 'lib/store/digital-products.ts:52',
  },
  {
    id: 'fund-ready-course',
    name: 'Fund-Ready Mini Course',
    price: '$149',
    priceInCents: 14900,
    benefit: 'Video course on compliance and positioning for workforce funding with downloadable workbook.',
    checkoutReady: false,
    source: 'lib/store/digital-products.ts:66',
  },
];

// ============================================
// DISCLAIMERS
// ============================================

export const DISCLAIMERS = {
  pricing: 'Final pricing depends on scope, branding, modules, and implementation support.',
  eligibility: 'Funding eligibility determined by local workforce boards and program requirements.',
  integration: 'Integrations available via API/webhooks; implementation depends on partner environment.',
  hiring: 'Hiring incentives subject to eligibility and approval requirements.',
  implementation: 'Implementation and configuration services scoped separately based on organizational needs.',
} as const;

// ============================================
// PLATFORM FEATURES (for /license/features)
// ============================================

export const PLATFORM_FEATURES = [
  {
    id: 'lms',
    name: 'LMS Delivery',
    description: 'Course management, progress tracking, and certificate generation.',
    capabilities: [
      'Course and module management',
      'Video and content hosting',
      'Progress tracking and completion',
      'Quiz and assessment tools',
      'Certificate generation',
    ],
  },
  {
    id: 'programs',
    name: 'Programs & Pathways',
    description: 'Structured career pathways with program catalogs and prerequisites.',
    capabilities: [
      'Program catalog management',
      'Career pathway mapping',
      'Prerequisite enforcement',
      'Cohort management',
      'Credential tracking',
    ],
  },
  {
    id: 'intake',
    name: 'Intake & Eligibility',
    description: 'Screening workflows, eligibility verification, and applicant routing.',
    capabilities: [
      'Application intake forms',
      'Eligibility screening',
      'Document collection',
      'Applicant routing',
      'Status notifications',
    ],
  },
  {
    id: 'employer',
    name: 'Employer & Apprenticeship',
    description: 'Partner portals, hiring pipelines, and apprenticeship oversight.',
    capabilities: [
      'Employer partner portals',
      'Candidate matching',
      'Hiring pipeline tracking',
      'Apprenticeship management',
      'OJT hour tracking',
    ],
  },
  {
    id: 'reporting',
    name: 'Reporting & Compliance',
    description: 'Baseline reporting for compliance, performance, and data exports.',
    capabilities: [
      'Enrollment reports',
      'Completion tracking',
      'Attendance records',
      'Outcome reporting',
      'Data exports (CSV)',
    ],
  },
  {
    id: 'payroll',
    name: 'HR & Payroll',
    description: 'Built-in payroll processing, staff onboarding, and hiring pipeline for licensee organizations.',
    capabilities: [
      'Bi-weekly payroll runs with tax calculations (federal, state, FICA)',
      'Pay methods: direct deposit, Elevate Pay Card (Visa), or paper check',
      'W-9 collection and secure storage',
      'Employee handbook with digital acknowledgment',
      'Staff skills checklist and competency tracking',
      'Hiring pipeline: job postings → competency test → video interview → offer',
      'Automated HR emails at every hiring and onboarding step',
      'Staff onboarding portal with completion tracking',
    ],
    tierAvailability: 'school_and_above',
    addOnPrice: '$1,500/year',
  },
];

// ============================================
// INTEGRATIONS
// ============================================

export const INTEGRATIONS = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    status: 'Integration-ready',
    description: 'CRM synchronization via API/webhooks.',
    note: DISCLAIMERS.integration,
  },
  {
    id: 'supabase',
    name: 'Supabase',
    status: 'Included',
    description: 'Authentication and database infrastructure.',
    note: 'Core infrastructure included with all licenses.',
  },
  {
    id: 'email',
    name: 'Email Providers',
    status: 'Configurable',
    description: 'Transactional email via Resend, SendGrid, or SMTP.',
    note: 'Provider configuration required during implementation.',
  },
  {
    id: 'credentialing',
    name: 'Credentialing Partners',
    status: 'Configurable',
    description: 'Certificate and credential verification services.',
    note: 'Partner integrations available based on requirements.',
  },
];

// ============================================
// ROUTES
// ============================================

export const ROUTES = {
  store: '/store',
  license: '/license',
  licenseFeatures: '/license/features',
  licenseIntegrations: '/license/integrations',
  licensePricing: '/license/pricing',
  licenseDemo: '/license/demo',
  demo: '/demo',
  demoLearner: '/demo/learner',
  demoAdmin: '/demo/admin',
  demoEmployer: '/demo/employer',
  schedule: '/demo',
  contact: '/contact',
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getFeaturedTier(): LicenseTier {
  return LICENSE_TIERS.find(t => t.featured) || LICENSE_TIERS[1];
}

export function getTierById(id: string): LicenseTier | undefined {
  return LICENSE_TIERS.find(t => t.id === id);
}

export function getStartingPrice(): string {
  const coreTier = getTierById('core');
  return coreTier?.price || '$4,999';
}
