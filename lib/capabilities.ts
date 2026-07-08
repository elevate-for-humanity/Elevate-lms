// =====================================================
// PLATFORM CAPABILITIES - SINGLE SOURCE OF TRUTH
// =====================================================

/**
 * What the platform DOES
 * Use this in marketing, sales, and partner docs
 */
export const PLATFORM_DOES = [
  'intake and pre-qualification',
  'program matching and recommendations',
  'document storage and management',
  'advisor workflow tools',
  'reporting and analytics',
  'partner portal access',
  'student progress tracking',
  'communication and notifications',
] as const;

/**
 * What the platform DOES NOT do
 * Critical for managing expectations
 */
export const PLATFORM_DOES_NOT = [
  'guarantee funding approval',
  'guarantee job placement',
  'replace workforce board decisions',
  'provide direct training (partners do)',
  'make final eligibility determinations (advisors do)',
  'issue credentials or certifications',
  'conduct background checks',
  'provide legal or financial advice',
] as const;

/**
 * What REQUIRES human involvement
 * These cannot be fully automated
 */
export const REQUIRES_HUMAN = [
  'eligibility review and verification',
  'funding application support',
  'career counseling and advising',
  'placement assistance',
  'conflict resolution',
  'special accommodations',
  'appeals and exceptions',
] as const;

/**
 * Partner tier definitions
 * Explicit feature boundaries
 */
export const PARTNER_TIERS = {
  BASIC: {
    name: 'Basic',
    price: 0,
    features: ['program listing', 'student referrals', 'basic reporting', 'email support'],
    limits: {
      programs: 3,
      students: 50,
      support: 'email only',
    },
  },
  PILOT: {
    name: 'Pilot',
    price: 500,
    features: [
      'all Basic features',
      'custom branding',
      'API access',
      'priority support',
      'monthly success call',
    ],
    limits: {
      programs: 10,
      students: 200,
      support: 'email + monthly call',
    },
  },
  FULL: {
    name: 'Full',
    price: 2000,
    features: [
      'all Pilot features',
      'white label portal',
      'SSO integration',
      'dedicated success manager',
      'custom reporting',
      '24/7 support',
    ],
    limits: {
      programs: 'unlimited',
      students: 'unlimited',
      support: '24/7 dedicated',
    },
  },
} as const;

/**
 * Explicitly NOT supported
 * Say no to these requests
 */
export const NOT_SUPPORTED = [
  'custom program creation by partners',
  'direct student payments',
  'training content delivery',
  'credential issuance',
  'employer direct hire',
  'background check services',
  'legal document preparation',
  'tax preparation',
  'housing assistance',
  'transportation services',
] as const;

/**
 * Service vs Platform boundary
 * What's software vs what's human work
 */
export const SERVICE_PLATFORM_BOUNDARY = {
  SOFTWARE: [
    'application forms',
    'document upload',
    'status tracking',
    'notifications',
    'reporting dashboards',
    'search and filtering',
  ],
  HUMAN_SERVICE: [
    'eligibility determination',
    'career counseling',
    'funding application help',
    'job placement support',
    'conflict resolution',
    'training delivery',
  ],
  CUSTOM_WORK: [
    'white label setup',
    'SSO integration',
    'custom reports',
    'data migration',
    'API integration',
  ],
} as const;

/**
 * Operational boundaries
 * What scales vs what doesn't
 */
export const OPERATIONAL_LIMITS = {
  SCALES_WELL: [
    'application intake',
    'document storage',
    'status updates',
    'automated notifications',
    'reporting',
  ],
  SCALES_POORLY: [
    'manual eligibility review',
    'one-on-one counseling',
    'custom partner requests',
    'phone support',
    'training delivery',
  ],
  REQUIRES_PLANNING: [
    'advisor capacity',
    'partner onboarding',
    'custom integrations',
    'compliance reviews',
  ],
} as const;

/**
 * Check if feature is supported
 */
export function isSupported(feature: string): boolean {
  return !NOT_SUPPORTED.includes(feature as any);
}

/**
 * Get tier features
 */
export function getTierFeatures(tier: keyof typeof PARTNER_TIERS) {
  return PARTNER_TIERS[tier];
}

/**
 * Check if tier has feature
 */
export function tierHasFeature(tier: keyof typeof PARTNER_TIERS, feature: string): boolean {
  return PARTNER_TIERS[tier].features.includes(feature);
}

/**
 * Get capability statement for audience
 */
export function getCapabilityStatement(audience: 'learner' | 'partner' | 'funder'): string {
  switch (audience) {
    case 'learner':
      return 'Elevate for Humanity connects you with funded training opportunities and provides support throughout your career journey.';
    case 'partner':
      return 'Elevate for Humanity provides the platform and tools to manage student intake, tracking, and reporting for your training programs.';
    case 'funder':
      return 'Elevate for Humanity streamlines intake, eligibility verification, and outcome reporting for workforce development programs.';
  }
}
