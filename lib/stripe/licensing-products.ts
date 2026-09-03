/**
 * Stripe Licensing Products Configuration
 *
 * Two products only:
 * 1. Managed Enterprise LMS Platform (subscription)
 * 2. Restricted Source-Use License (invoice only)
 *
 * All products are licensed access. Ownership is not transferred.
 */

export const LICENSING_PRODUCTS = {
  // Primary: Managed Enterprise LMS
  managed: {
    name: 'Managed Enterprise LMS Platform',
    description: 'Subscription-based enterprise LMS operated by Elevate for Humanity',
    type: 'subscription' as const,
    prices: {
      monthly: {
        min: 1500_00, // $1,500 in cents
        max: 3500_00, // $3,500 in cents
      },
      annual: {
        min: 15000_00, // $15,000/year
        max: 35000_00, // $35,000/year
      },
      setup: {
        min: 7500_00, // $7,500
        max: 15000_00, // $15,000
      },
    },
    metadata: {
      license_type: 'managed',
      ownership: 'false',
      enforcement: 'total_lockout',
      source_access: 'false',
    },
    features: [
      'Enterprise LMS (courses, assessments, certificates)',
      'Multi-tenant organization setup',
      'Custom domain and managed branding',
      'Fully managed hosting, security, and upgrades',
      'Compliance-ready infrastructure',
      'Automated license enforcement with total lockout on non-payment',
    ],
  },

  // Secondary: Restricted Source-Use License
  sourceUse: {
    name: 'Restricted Source-Use License',
    description: 'Enterprise-only restricted internal source code access',
    type: 'invoice' as const, // Manual invoice only, no checkout
    prices: {
      minimum: 75000_00, // $75,000 minimum
    },
    metadata: {
      license_type: 'source_use',
      ownership: 'false',
      rebranding_allowed: 'false',
      resale_allowed: 'false',
      credentials_included: 'false',
      managed_hosting: 'false',
    },
    restrictions: [
      'No ownership of the software',
      'No rebranding or white-label rights',
      'No resale or sublicensing',
      'No credential or ETPL authority',
      'No managed hosting or infrastructure',
      'No right to represent the platform as customer-owned',
    ],
    requirements: [
      'Enterprise approval required',
      'Signed agreement before access',
      'Manual invoice process',
    ],
  },
} as const;

/**
 * License enforcement rules
 */
export const ENFORCEMENT_RULES = {
  managed: {
    // Subscription status determines access
    active: 'full_access',
    past_due: 'grace_period_7_days',
    unpaid: 'suspended',
    canceled: 'total_lockout',

    // Grace period before lockout
    gracePeriodDays: 7,

    // What happens on lockout
    lockoutBehavior: {
      adminAccess: false,
      userAccess: false,
      apiAccess: false,
      dataExport: true, // Allow data export during grace period
      dataRetention: '90_days', // Data retained 90 days after lockout
    },
  },
  sourceUse: {
    // No automated enforcement - contract-based
    enforcement: 'contractual',
  },
} as const;

/**
 * Required disclaimer text
 */
export const LICENSING_DISCLAIMER =
  'All products are licensed access to platforms operated by Elevate for Humanity. ' +
  'Ownership of software, infrastructure, and intellectual property is not transferred.';

export const OWNERSHIP_STATEMENT =
  'We sell managed access and operational control, not software ownership.';
