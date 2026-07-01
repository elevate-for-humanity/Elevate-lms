// Store Products Data Model
// This defines what we sell: licensed platform access + deployable apps

export type LicenseType = 'single' | 'school' | 'enterprise';
export type BillingType = 'one_time' | 'subscription';

export interface PlatformApp {
  id: string;
  key: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
  icon?: string;
}

export interface PaymentPlan {
  months: number;
  monthlyPrice: number;
  totalPrice: number;
  stripePriceId?: string;
}

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  billingType: BillingType;
  licenseType: LicenseType;
  appsIncluded: string[];
  requiresApproval?: boolean;
  features: string[];
  idealFor: string[];
  stripeProductId?: string;
  stripePriceId?: string;
  paymentPlans?: PaymentPlan[];
}

// Platform Apps (Modular Components)
export const PLATFORM_APPS: PlatformApp[] = [
  {
    id: 'lms',
    key: 'lms',
    name: 'Learning Management System',
    description: 'Courses, SCORM, certifications, progress tracking, quizzes, and assignments.',
    enabledByDefault: true,
    icon: '📚',
  },
  {
    id: 'enrollment',
    key: 'enrollment',
    name: 'Enrollment & Intake',
    description: 'Applications, approvals, cohort management, and student onboarding.',
    enabledByDefault: true,
    icon: '📝',
  },
  {
    id: 'admin',
    key: 'admin',
    name: 'Admin Dashboard',
    description: 'User management, reporting, analytics, and system configuration.',
    enabledByDefault: true,
    icon: '⚙️',
  },
  {
    id: 'payments',
    key: 'payments',
    name: 'Payments & Billing',
    description: 'Stripe integration, invoices, funding sources, and financial tracking.',
    enabledByDefault: true,
    icon: '💳',
  },
  {
    id: 'partner-dashboard',
    key: 'partner-dashboard',
    name: 'Partner Dashboard',
    description: 'Tools for schools, employers, and workforce partners to manage their programs.',
    enabledByDefault: false,
    icon: '🤝',
  },
  {
    id: 'case-management',
    key: 'case-management',
    name: 'Case Management',
    description: 'Track barriers, interventions, and wraparound services for learners.',
    enabledByDefault: false,
    icon: '📋',
  },
  {
    id: 'employer-portal',
    key: 'employer-portal',
    name: 'Employer Portal',
    description: 'Job postings, candidate matching, and hiring pipeline management.',
    enabledByDefault: false,
    icon: '💼',
  },
  {
    id: 'compliance',
    key: 'compliance',
    name: 'Workforce Compliance',
    description: 'WIOA, DOL, and grant reporting for workforce development agencies.',
    enabledByDefault: false,
    icon: '⚖️',
  },
  {
    id: 'mobile-app',
    key: 'mobile-app',
    name: 'Mobile Learner App',
    description: 'Progressive Web App (PWA) for learners to access training on the go.',
    enabledByDefault: true,
    icon: '📱',
  },
  {
    id: 'ai-tutor',
    key: 'ai-tutor',
    name: 'AI Tutor & Assistant',
    description: '24/7 AI-powered tutoring and student support integrated into courses.',
    enabledByDefault: false,
    icon: '🤖',
  },
];

// Managed Platform Plans (Hosted by Elevate)
export const WORKFORCE_PLATFORM_PLANS: StoreProduct[] = [
  {
    id: 'platform-solo',
    slug: 'solo-subscription',
    name: 'Solo Practitioner Subscription',
    description: 'Entry-level platform access for individual business owners.',
    longDescription:
      'Everything an individual needs to start tracking training and compliance. Includes core CRM, website, and basic AI tools. Scale as you grow with modular add-ons.',
    price: 29,
    billingType: 'subscription',
    licenseType: 'single',
    appsIncluded: ['lms', 'enrollment', 'admin'],
    features: [
      '1 admin user',
      'Basic AI Assistant',
      'Course delivery (up to 10 students)',
      'Basic compliance tracking',
      'Email support',
    ],
    idealFor: ['Solo instructors', 'Small shop owners', 'New apprenticeships'],
    requiresApproval: false,
    stripeProductId: 'prod_SoloStarter',
    stripePriceId: 'price_SoloStarter_Monthly',
  },
  {
    id: 'efh-monthly',
    slug: 'monthly-subscription',
    name: 'Business Monthly Subscription',
    description: 'Standard access for small business workforce providers.',
    longDescription:
      'Standard business access to the core platform. Scale your workforce training with monthly billing and full modular flexibility.',
    price: 499,
    billingType: 'subscription',
    licenseType: 'single',
    appsIncluded: ['lms', 'enrollment', 'admin', 'payments', 'mobile-app'],
    features: [
      'Everything in Solo',
      'Up to 3 admin users',
      'Up to 100 active students',
      'Standard support',
      'Monthly updates',
    ],
    idealFor: [
      'Small training providers',
      'Seasonal programs',
      'Budget-conscious organizations',
    ],
    requiresApproval: false,
    stripeProductId: 'prod_ToOZPCv9vGYJgc',
    stripePriceId: 'price_1SqlmcIRNf5vPH3AtcLZ9zYR',
  },
  {
    id: 'efh-school-license',
    slug: 'school-license',
    name: 'Institutional School License',
    description: 'Full white-label solution for community colleges and large nonprofits.',
    longDescription:
      'Enterprise-grade infrastructure for institutions. Includes partner dashboards, case management, and multi-program compliance tracking.',
    price: 15000,
    billingType: 'one_time',
    licenseType: 'school',
    appsIncluded: [
      'lms',
      'enrollment',
      'admin',
      'payments',
      'partner-dashboard',
      'case-management',
      'compliance',
      'mobile-app',
    ],
    features: [
      'White-label portal branding',
      'Unlimited students and courses',
      'Partner/Employer dashboards',
      'Full compliance suite (WIOA/DOL)',
      'Priority support',
      'The Bosses (VR) - Training Demos',
    ],
    idealFor: [
      'Community colleges',
      'Workforce development boards',
      'Large nonprofits',
    ],
    requiresApproval: false,
    stripeProductId: 'prod_ToOZBAQ4kvlKKk',
    stripePriceId: 'price_1SqlmbIRNf5vPH3AAK1dIDMK',
  },
  {
    id: 'efh-enterprise',
    slug: 'enterprise-license',
    name: 'Enterprise Workforce Solution',
    description:
      'Custom deployment with AI agents, VR Bosses suite, and full ecosystem integration.',
    longDescription:
      'The ultimate workforce operating system. Fully sovereign deployment with high-compliance monitoring, enterprise AI agents, and the complete "Bosses" VR ecosystem.',
    price: 75000,
    billingType: 'one_time',
    licenseType: 'enterprise',
    appsIncluded: [
      'lms',
      'enrollment',
      'admin',
      'payments',
      'partner-dashboard',
      'case-management',
      'employer-portal',
      'compliance',
      'mobile-app',
      'ai-tutor',
    ],
    features: [
      'Everything in School License',
      'Enterprise AI Agents',
      'The Bosses (VR) - Ultimate Suite',
      'Multi-tenant architecture',
      'Dedicated account manager',
      'Custom API integrations',
    ],
    idealFor: [
      'State workforce agencies',
      'Enterprise corporations',
      'Multi-state training networks',
    ],
    requiresApproval: false,
    stripeProductId: 'prod_ToOZ6fD0L8CUyV',
    stripePriceId: 'price_1SqlmbIRNf5vPH3AAxjxhPYN',
  },
];

// Clone/Codebase Licenses (Source Code Purchase)
export const CLONE_LICENSES: StoreProduct[] = [
  {
    id: 'clone-starter',
    slug: 'starter-license',
    name: 'Elevate LMS Starter Clone',
    description: 'Single site license with 1 year updates and email support.',
    longDescription:
      'Get the complete Elevate LMS codebase for a single site deployment. Includes 1 year of updates and email support.',
    price: 299,
    billingType: 'one_time',
    licenseType: 'single',
    appsIncluded: ['lms', 'enrollment', 'admin', 'mobile-app'],
    features: [
      'Complete Next.js codebase',
      'Single site deployment',
      '1 year of updates',
      'Email support',
      'AI Workforce Assistant (Core)',
    ],
    idealFor: ['Developers', 'Small shop owners', 'Pilot projects'],
    requiresApproval: false,
    stripeProductId: 'prod_ToOiTGsUDJPopc',
    stripePriceId: 'price_1SqluuIRNf5vPH3A7VEoPwRw',
  },
  {
    id: 'clone-pro',
    slug: 'pro-license',
    name: 'Elevate LMS Pro Clone',
    description: 'Multi-site license with lifetime updates and Dev Studio.',
    longDescription:
      'Deploy on multiple sites with lifetime updates, priority support, and access to the Dev Studio for customization.',
    price: 999,
    billingType: 'one_time',
    licenseType: 'school',
    appsIncluded: ['lms', 'enrollment', 'admin', 'payments', 'partner-dashboard', 'mobile-app'],
    features: [
      'Multi-site deployment',
      'Lifetime updates',
      'Dev Studio included',
      'AI Course Builder Suite',
      'The Bosses (VR) - Training Demos',
    ],
    idealFor: ['Agencies', 'Large training providers'],
    requiresApproval: false,
    stripeProductId: 'prod_ToOiCEdY0Z48Mp',
    stripePriceId: 'price_1SqluuIRNf5vPH3AAHrdLDu3',
  },
  {
    id: 'clone-enterprise',
    slug: 'enterprise-clone-license',
    name: 'Elevate LMS Enterprise Clone',
    description: 'Unlimited sites, white-label, and custom feature source.',
    longDescription:
      'Full enterprise source code rights with unlimited sites, white-label branding, and dedicated feature development support.',
    price: 75000,
    billingType: 'one_time',
    licenseType: 'enterprise',
    appsIncluded: [
      'lms',
      'enrollment',
      'admin',
      'payments',
      'partner-dashboard',
      'case-management',
      'employer-portal',
      'compliance',
      'mobile-app',
      'ai-tutor',
    ],
    features: [
      'Complete Source Sovereignty',
      'Unlimited deployments',
      'The Bosses (VR) - Enterprise Suite',
      'Enterprise AI Agents',
      'Architecture consultation',
    ],
    idealFor: ['Enterprise orgs', 'Government agencies'],
    requiresApproval: false,
    stripeProductId: 'prod_ToOiS4Hg9blBzB',
    stripePriceId: 'price_1SqluuIRNf5vPH3ALcAcExyz',
  },
];

// Modular Add-Ons (Subscriptions)
export const COMMUNITY_ADDONS: StoreProduct[] = [
  {
    id: 'community-hub',
    slug: 'community-hub',
    name: 'Community Hub Add-On',
    description: 'Discussion forums, groups, and events.',
    longDescription: 'Add engagement features to your platform.',
    price: 99,
    billingType: 'subscription',
    licenseType: 'single',
    appsIncluded: ['community-hub'],
    features: ['Discussion forums', 'Groups', 'Leaderboards'],
    idealFor: ['Engaged student communities'],
    requiresApproval: false,
  },
  {
    id: 'ai-advanced-agent',
    slug: 'ai-advanced-agent',
    name: 'AI Advanced Agent Suite',
    description: 'Upgrade to high-performance AI agents.',
    longDescription: 'Unlock specialized agents for grading and coaching.',
    price: 49,
    billingType: 'subscription',
    licenseType: 'single',
    appsIncluded: ['ai-tutor'],
    features: ['Advanced Grading', 'Scenario Coaching'],
    idealFor: ['Pro instructors'],
    requiresApproval: false,
  },
];

// Grant & Contract Automation Suite Add-ons (One-time)
export const GRANT_CONTRACT_ADDONS: StoreProduct[] = [
  {
    id: 'grant-suite',
    slug: 'grant-suite',
    name: 'Grant Automation Suite',
    description: 'AI-assisted grant narratives and tracking.',
    longDescription: 'Automate your grant writing process.',
    price: 1499,
    billingType: 'one_time',
    licenseType: 'single',
    appsIncluded: ['compliance'],
    features: ['Narrative generation', 'Pipeline tracking'],
    idealFor: ['Nonprofits'],
    requiresApproval: false,
  },
];
// Aliases for backwards compatibility
export const ALL_PRODUCTS = [...PLATFORM_APPS];
export const STORE_PRODUCTS = [...WORKFORCE_PLATFORM_PLANS];
