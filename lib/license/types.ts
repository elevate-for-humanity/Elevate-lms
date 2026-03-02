import { PRICES } from '@/lib/stripe/prices';

/**
 * License Types and Pricing Tiers
 * 
 * Three infrastructure tiers:
 * 1. Core ($750/month) - Solo operators, pilots
 * 2. Institutional ($2,500/month) - Schools, nonprofits, training providers
 * 3. Enterprise ($8,500/month) - Workforce boards, agencies, regional systems
 */

export type LicenseStatus = 
  | 'trial'      // Active trial period
  | 'active'     // Paid and current
  | 'past_due'   // Payment failed, grace period
  | 'canceled'   // User canceled, access until period end
  | 'suspended'; // Payment failed after grace, locked out

export type PlanId = 
  // Infrastructure Tiers (Monthly)
  | 'core'           // $750/month
  | 'institutional'  // $2,500/month
  | 'enterprise';    // $8,500/month

export type PlanCategory = 'infrastructure';

export interface License {
  id: string;
  organizationId: string;
  status: LicenseStatus;
  planId: PlanId;
  
  // Trial tracking
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  
  // Stripe integration
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  
  // Billing period
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  
  // Payment tracking
  lastPaymentStatus: string | null;
  lastInvoiceUrl: string | null;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  canceledAt: Date | null;
  suspendedAt: Date | null;
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  domain: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type OrganizationType = 
  | 'workforce_board'
  | 'nonprofit'
  | 'training_provider'
  | 'apprenticeship_sponsor'
  | 'government'
  | 'school'
  | 'employer'
  | 'other';

/**
 * Trial configuration
 */
export const TRIAL_DAYS = 14;

/**
 * Grace period after payment failure (days)
 */
export const GRACE_PERIOD_DAYS = 3;

/**
 * Plan definitions
 */
export interface PlanDefinition {
  id: PlanId;
  name: string;
  category: PlanCategory;
  price: number;
  priceDisplay: string;
  interval: 'month';
  stripePriceId?: string;
  trialDays: number;
  features: string[];
  limits: {
    learners: number;
    admins: number | 'unlimited';
    programs: number | 'unlimited';
    organizations: number | 'unlimited';
  };
  replaces: string;
  audience: string[];
  highlighted?: boolean;
  requiresContact?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  // ============================================
  // CORE WORKFORCE INFRASTRUCTURE - $750/month
  // ============================================
  core: {
    id: 'core',
    name: 'Core Workforce Infrastructure',
    category: 'infrastructure',
    price: 750,
    priceDisplay: '$750',
    interval: 'month',
    stripePriceId: PRICES.CORE,
    trialDays: TRIAL_DAYS,
    features: [
      'Automated learner intake and eligibility screening',
      'Funded (WIOA / WRG / JRI) and self-pay enrollment paths',
      'Deterministic status tracking and notifications',
      'Course delivery and progress tracking',
      'Credential issuance and public verification',
      'Secure records and audit trail',
      'Role-based dashboards (learner + admin)',
    ],
    limits: {
      learners: 100,
      admins: 3,
      programs: 3,
      organizations: 1,
    },
    replaces: 'Admissions intake, eligibility screening, manual tracking, certificate handling.',
    audience: ['Solo operators', 'Small nonprofits', 'Pilot programs'],
  },

  // ============================================
  // INSTITUTIONAL OPERATOR - $2,500/month
  // ============================================
  institutional: {
    id: 'institutional',
    name: 'Institutional Operator',
    category: 'infrastructure',
    price: 2500,
    priceDisplay: '$2,500',
    interval: 'month',
    stripePriceId: PRICES.INSTITUTIONAL,
    trialDays: TRIAL_DAYS,
    highlighted: true,
    features: [
      'Everything in Core, plus:',
      'Multi-program and cohort management',
      'Compliance-ready enrollment workflows',
      'Program holder and partner dashboards',
      'White-label branding',
      'Funding pathway governance',
      'Oversight-ready reporting views',
    ],
    limits: {
      learners: 1000,
      admins: 25,
      programs: 25,
      organizations: 1,
    },
    replaces: 'Admissions staff, registrar coordination, compliance tracking, reporting prep.',
    audience: ['Training providers', 'Schools', 'Credentialing bodies', 'Multi-program nonprofits'],
  },

  // ============================================
  // ENTERPRISE WORKFORCE INFRASTRUCTURE - $8,500/month
  // ============================================
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Workforce Infrastructure',
    category: 'infrastructure',
    price: 8500,
    priceDisplay: '$8,500',
    interval: 'month',
    stripePriceId: PRICES.ENTERPRISE,
    trialDays: 0,
    requiresContact: true,
    features: [
      'Everything above, plus:',
      'Employer and workforce board portals',
      'Multi-tenant and multi-region governance',
      'Advanced outcome and compliance reporting',
      'AI-guided avatars (staff replacement)',
      'API access and integrations',
      'Priority support and escalation',
    ],
    limits: {
      learners: 10000,
      admins: 'unlimited',
      programs: 'unlimited',
      organizations: 'unlimited',
    },
    replaces: 'Entire workforce operations teams, compliance units, reporting analysts.',
    audience: ['Workforce boards', 'Government agencies', 'Regional operators', 'Large employers'],
  },
};

/**
 * Add-on definitions
 */
export interface AddOnDefinition {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  interval: 'one_time' | 'month';
  description: string;
  features: string[];
}

export const ADD_ONS: Record<string, AddOnDefinition> = {
  onboarding: {
    id: 'onboarding',
    name: 'Institutional Onboarding & Configuration',
    price: 15000,
    priceDisplay: '$15,000',
    interval: 'one_time',
    description: 'Full setup and configuration for institutional deployment',
    features: [
      'Program and credential setup',
      'Compliance mapping',
      'Reporting alignment',
      'Funding workflow configuration',
    ],
  },
  high_volume: {
    id: 'high_volume',
    name: 'High-Volume Learner Expansion',
    price: 1000,
    priceDisplay: '$1,000',
    interval: 'month',
    description: 'Per additional 1,000 learners beyond tier capacity',
    features: [
      'Scale beyond tier capacity',
      'Same compliance coverage',
      'No performance limits',
    ],
  },
};

/**
 * Get all plans
 */
export function getAllPlans(): PlanDefinition[] {
  return Object.values(PLANS);
}

/**
 * Get plan by ID
 */
export function getPlan(planId: PlanId): PlanDefinition | undefined {
  return PLANS[planId];
}

/**
 * Check if plan requires contact/sales
 */
export function requiresContact(planId: PlanId): boolean {
  return PLANS[planId]?.requiresContact === true;
}

/**
 * Check if license allows admin actions
 */
export function canPerformAdminActions(status: LicenseStatus): boolean {
  return status === 'trial' || status === 'active' || status === 'past_due';
}

/**
 * Check if license is in good standing
 */
export function isLicenseActive(status: LicenseStatus): boolean {
  return status === 'trial' || status === 'active';
}

/**
 * Get status message for UI
 */
export function getStatusMessage(license: License): string {
  switch (license.status) {
    case 'trial':
      if (license.trialEndsAt) {
        const days = Math.ceil((license.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Trial: ${days} day${days !== 1 ? 's' : ''} remaining`;
      }
      return 'Trial active';
    case 'active':
      return 'License active';
    case 'past_due':
      return 'Payment past due - please update billing';
    case 'canceled':
      if (license.currentPeriodEnd) {
        return `Canceled - access until ${license.currentPeriodEnd.toLocaleDateString()}`;
      }
      return 'Canceled';
    case 'suspended':
      return 'License suspended - payment required';
    default:
      return 'Unknown status';
  }
}

/**
 * Get banner type for status
 */
export function getStatusBannerType(status: LicenseStatus): 'info' | 'warning' | 'error' | null {
  switch (status) {
    case 'trial': return 'info';
    case 'active': return null;
    case 'past_due': return 'warning';
    case 'canceled': return 'warning';
    case 'suspended': return 'error';
    default: return null;
  }
}
