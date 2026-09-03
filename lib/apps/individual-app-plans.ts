/**
 * Individual (per-user) subscription plans for Elevate Store apps.
 * Billed monthly via Stripe — see app/api/apps/upgrade/route.ts APP_PRICES.
 *
 * IMPORTANT: these plans grant access to one authenticated user account.
 * Organization-wide seats, shared entity ownership, white-label delivery and
 * contractual SLAs are enterprise procurement capabilities and must not be
 * represented here unless backed by an organization entitlement contract.
 */

export type IndividualAppSlug = 'website-builder' | 'sam-gov' | 'grants';

export type IndividualPlanId = 'starter' | 'professional' | 'enterprise';

export interface IndividualPlanDefinition {
  id: IndividualPlanId;
  name: string;
  priceMonthly: number;
  priceLabel: string;
  features: string[];
  popular?: boolean;
}

export interface IndividualAppCatalog {
  slug: IndividualAppSlug;
  displayName: string;
  tagline: string;
  trialDays: number;
  trialHref: string;
  appHref: string;
  importHref?: string;
  plans: IndividualPlanDefinition[];
}

const WEBSITE_BUILDER_PLANS: IndividualPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceLabel: '$29/mo',
    features: ['1 website', '5 pages', 'Basic templates', 'Elevate subdomain', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 79,
    priceLabel: '$79/mo',
    popular: true,
    features: [
      '3 websites',
      'Unlimited pages',
      'All templates',
      'Custom domain',
      'LMS enrollment widgets',
      'Import existing site',
      'Priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 199,
    priceLabel: '$199/mo',
    features: [
      'Unlimited websites for the licensed user',
      'Advanced builder controls',
      'Import existing sites',
      'Priority support',
      'Organization licensing available through procurement review',
    ],
  },
];

const SAM_GOV_PLANS: IndividualPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 49,
    priceLabel: '$49/mo',
    features: ['1 entity', 'Registration workspace', 'Renewal reminders', 'Email support'],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 149,
    priceLabel: '$149/mo',
    popular: true,
    features: ['Up to 5 entity records', 'Compliance dashboard', 'Document organization', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 399,
    priceLabel: '$399/mo',
    features: ['Unlimited entity records for the licensed user', 'Advanced compliance workspace', 'Priority support', 'Organization licensing available through procurement review'],
  },
];

const GRANTS_PLANS: IndividualPlanDefinition[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 79,
    priceLabel: '$79/mo',
    features: ['50 grant searches/mo', 'Basic matching workflow', 'Deadline visibility', 'Saved-grant organization'],
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 199,
    priceLabel: '$199/mo',
    popular: true,
    features: ['Expanded discovery capacity', 'Application tracking', 'Budget workflow tools where enabled', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 499,
    priceLabel: '$499/mo',
    features: ['Advanced grants workspace', 'Compliance workflow support', 'Priority support', 'Organization licensing available through procurement review'],
  },
];

export const INDIVIDUAL_APP_CATALOG: Record<IndividualAppSlug, IndividualAppCatalog> = {
  'website-builder': {
    slug: 'website-builder',
    displayName: 'Website Builder',
    tagline: 'For individual providers and small training businesses',
    trialDays: 14,
    trialHref: '/apps/website-builder/start-trial',
    appHref: '/apps/website-builder',
    importHref: '/apps/website-builder/import',
    plans: WEBSITE_BUILDER_PLANS,
  },
  'sam-gov': {
    slug: 'sam-gov',
    displayName: 'SAM.gov Manager',
    tagline: 'For individual contractors and small businesses',
    trialDays: 14,
    trialHref: '/apps/sam-gov/start-trial',
    appHref: '/apps/sam-gov',
    plans: SAM_GOV_PLANS,
  },
  grants: {
    slug: 'grants',
    displayName: 'Grants Discovery',
    tagline: 'For individual grant writers and small nonprofits',
    trialDays: 14,
    trialHref: '/apps/grants/start-trial',
    appHref: '/apps/grants',
    plans: GRANTS_PLANS,
  },
};

export function getIndividualAppCatalog(slug: string): IndividualAppCatalog | null {
  if (slug in INDIVIDUAL_APP_CATALOG) {
    return INDIVIDUAL_APP_CATALOG[slug as IndividualAppSlug];
  }
  return null;
}
