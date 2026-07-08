/**
 * Beauty & personal-services vertical — org dashboard clone (managed white-label).
 * Checkout reuses platform license slugs; trial uses /api/trial/start-managed.
 */

export const BEAUTY_PROGRAM_SLUGS = [
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'esthetician',
  'nail-technician-apprenticeship',
  'beauty-career-educator',
] as const;

export type BeautyProgramSlug = (typeof BEAUTY_PROGRAM_SLUGS)[number];

export interface BeautyProgramCard {
  slug: BeautyProgramSlug;
  name: string;
  href: string;
  summary: string;
}

export const BEAUTY_PROGRAM_CARDS: BeautyProgramCard[] = [
  {
    slug: 'barber-apprenticeship',
    name: 'Barber Apprenticeship',
    href: '/programs/barber-apprenticeship',
    summary: 'OJT hours, host shops, state board prep, and WIOA-ready enrollment.',
  },
  {
    slug: 'cosmetology-apprenticeship',
    name: 'Cosmetology Apprenticeship',
    href: '/programs/cosmetology-apprenticeship',
    summary: 'Apprenticeship tracking, curriculum modules, and compliance reporting.',
  },
  {
    slug: 'esthetician-apprenticeship',
    name: 'Esthetician Apprenticeship',
    href: '/programs/esthetician-apprenticeship',
    summary: 'Clinical hours, instructor sign-off, and learner progress dashboards.',
  },
  {
    slug: 'esthetician',
    name: 'Esthetician Program',
    href: '/programs/esthetician',
    summary: 'Short-form esthetician pathway with enrollment and credential tracking.',
  },
  {
    slug: 'nail-technician-apprenticeship',
    name: 'Nail Technician Apprenticeship',
    href: '/programs/nail-technician-apprenticeship',
    summary: 'Salon partners, hour logs, and board-aligned lesson structure.',
  },
  {
    slug: 'beauty-career-educator',
    name: 'Beauty Career Educator',
    href: '/programs/beauty-career-educator',
    summary: 'Train-the-trainer track for schools expanding instructor capacity.',
  },
];

/** Prefill value for managed trial form */
export const BEAUTY_TRIAL_PROGRAMS_PREFILL = BEAUTY_PROGRAM_SLUGS.join(', ');

export interface BeautyDashboardClonePlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  setupFee: number;
  features: string[];
  checkoutHref: string;
  trialQuery: string;
  popular?: boolean;
}

export const BEAUTY_DASHBOARD_CLONE_PLANS: BeautyDashboardClonePlan[] = [
  {
    id: 'beauty-growth',
    name: 'Beauty School Starter',
    description: 'Single-location schools and boutique academies',
    monthlyPrice: 1500,
    setupFee: 7500,
    features: [
      'White-label admin dashboard (your brand)',
      'Up to 500 active learners',
      'Barber, cosmetology, esthetician program templates',
      'Enrollment & document intake',
      'OJT / apprenticeship hour tracking',
      'Instructor & student portals',
      'Certificate and progress reporting',
    ],
    checkoutHref: '/store/licenses/checkout/efh-core-platform',
    trialQuery: '?vertical=beauty',
    popular: false,
  },
  {
    id: 'beauty-professional',
    name: 'Beauty Provider Pro',
    description: 'Multi-program schools and workforce partners',
    monthlyPrice: 2500,
    setupFee: 10000,
    features: [
      'Everything in Starter',
      'Up to 2,000 active learners',
      'Partner & employer dashboards',
      'Host shop / salon partner management',
      'WIOA & grant compliance exports',
      'BNPL and payment plan checkout',
      'Priority onboarding',
    ],
    checkoutHref: '/store/licenses/checkout/school-license',
    trialQuery: '?vertical=beauty',
    popular: true,
  },
  {
    id: 'beauty-enterprise',
    name: 'Beauty Enterprise',
    description: 'State boards, chains, and multi-site networks',
    monthlyPrice: 3500,
    setupFee: 15000,
    features: [
      'Unlimited learners',
      'Multi-location admin clone',
      'Custom domain & API access',
      'Dedicated success manager',
      'Advanced analytics & audit logs',
      'Optional source-code clone license',
    ],
    checkoutHref: '/contact?subject=Beauty%20Enterprise%20Dashboard%20Clone',
    trialQuery: '?vertical=beauty',
    popular: false,
  },
];

export const BEAUTY_DASHBOARD_CLONE_META = {
  title: 'Beauty Program Dashboard Clone | Elevate Store',
  description:
    'License a white-label admin dashboard for outside beauty schools and training organizations. Barber, cosmetology, esthetician, and nail programs with 14-day managed trial.',
  canonical: 'https://www.elevateforhumanity.org/store/beauty-programs',
};
