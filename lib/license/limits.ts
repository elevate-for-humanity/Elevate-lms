/**
 * License Limit Enforcement
 *
 * Hard ceilings that force enterprise conversion.
 * These are not suggestions. They are walls.
 */

import { PlanId, PLANS } from './types';

export interface UsageMetrics {
  activeStudents: number;
  adminUsers: number;
  programs: number;
  sites: number;
}

export interface LimitCheck {
  withinLimits: boolean;
  limitReached: 'students' | 'admins' | 'programs' | 'sites' | null;
  currentUsage: number;
  limit: number | 'unlimited';
  percentUsed: number;
  upgradeRequired: boolean;
  message: string | null;
}

/**
 * Enterprise triggers - any of these = enterprise conversation
 */
export const ENTERPRISE_TRIGGERS = {
  // Hard student limits
  STUDENT_LIMIT_STARTER: 100,
  STUDENT_LIMIT_PROFESSIONAL: 500,

  // Hard admin limits
  ADMIN_LIMIT_STARTER: 1,
  ADMIN_LIMIT_PROFESSIONAL: 5,

  // Program limits
  PROGRAM_LIMIT_STARTER: 3,
  PROGRAM_LIMIT_PROFESSIONAL: 'unlimited' as const,

  // Multi-site = always enterprise
  MULTI_SITE_THRESHOLD: 1,

  // Warning thresholds (% of limit)
  WARNING_THRESHOLD: 80,
  CRITICAL_THRESHOLD: 95,
};

/**
 * Check if usage is within plan limits
 */
export function checkLimits(planId: PlanId, usage: UsageMetrics): LimitCheck {
  const plan = PLANS[planId];
  if (!plan) {
    return {
      withinLimits: false,
      limitReached: null,
      currentUsage: 0,
      limit: 0,
      percentUsed: 0,
      upgradeRequired: true,
      message: 'Invalid plan',
    };
  }

  const limits = plan.limits;

  // Check students
  if (typeof limits.learners === 'number') {
    if (usage.activeStudents >= limits.learners) {
      return {
        withinLimits: false,
        limitReached: 'students',
        currentUsage: usage.activeStudents,
        limit: limits.learners,
        percentUsed: 100,
        upgradeRequired: true,
        message: `You've reached the ${limits.learners} student limit on your ${plan.name} plan.`,
      };
    }
  }

  // Check admins
  if (typeof limits.admins === 'number') {
    if (usage.adminUsers >= limits.admins) {
      return {
        withinLimits: false,
        limitReached: 'admins',
        currentUsage: usage.adminUsers,
        limit: limits.admins,
        percentUsed: 100,
        upgradeRequired: true,
        message: `You've reached the ${limits.admins} admin limit on your ${plan.name} plan.`,
      };
    }
  }

  // Check programs
  if (typeof limits.programs === 'number') {
    if (usage.programs >= limits.programs) {
      return {
        withinLimits: false,
        limitReached: 'programs',
        currentUsage: usage.programs,
        limit: limits.programs,
        percentUsed: 100,
        upgradeRequired: true,
        message: `You've reached the ${limits.programs} program limit on your ${plan.name} plan.`,
      };
    }
  }

  // Check multi-site (always enterprise)
  if (usage.sites > ENTERPRISE_TRIGGERS.MULTI_SITE_THRESHOLD) {
    return {
      withinLimits: false,
      limitReached: 'sites',
      currentUsage: usage.sites,
      limit: 1,
      percentUsed: 100,
      upgradeRequired: true,
      message: 'Multi-site deployment requires an Enterprise license.',
    };
  }

  // Calculate highest usage percentage for warnings
  let highestPercent = 0;
  if (typeof limits.learners === 'number') {
    highestPercent = Math.max(highestPercent, (usage.activeStudents / limits.learners) * 100);
  }
  if (typeof limits.admins === 'number') {
    highestPercent = Math.max(highestPercent, (usage.adminUsers / limits.admins) * 100);
  }
  if (typeof limits.programs === 'number') {
    highestPercent = Math.max(highestPercent, (usage.programs / limits.programs) * 100);
  }

  return {
    withinLimits: true,
    limitReached: null,
    currentUsage: 0,
    limit: 'unlimited',
    percentUsed: Math.round(highestPercent),
    upgradeRequired: false,
    message: null,
  };
}

/**
 * Check if approaching limits (for warnings)
 */
export function isApproachingLimit(
  planId: PlanId,
  usage: UsageMetrics,
): {
  approaching: boolean;
  metric: 'students' | 'admins' | 'programs' | null;
  percentUsed: number;
  message: string | null;
} {
  const plan = PLANS[planId];
  if (!plan) {
    return { approaching: false, metric: null, percentUsed: 0, message: null };
  }

  const limits = plan.limits;

  // Check students
  if (typeof limits.learners === 'number') {
    const percent = (usage.activeStudents / limits.learners) * 100;
    if (percent >= ENTERPRISE_TRIGGERS.WARNING_THRESHOLD) {
      return {
        approaching: true,
        metric: 'students',
        percentUsed: Math.round(percent),
        message: `You're using ${usage.activeStudents} of ${limits.learners} students (${Math.round(percent)}%).`,
      };
    }
  }

  // Check admins
  if (typeof limits.admins === 'number') {
    const percent = (usage.adminUsers / limits.admins) * 100;
    if (percent >= ENTERPRISE_TRIGGERS.WARNING_THRESHOLD) {
      return {
        approaching: true,
        metric: 'admins',
        percentUsed: Math.round(percent),
        message: `You're using ${usage.adminUsers} of ${limits.admins} admin seats (${Math.round(percent)}%).`,
      };
    }
  }

  // Check programs
  if (typeof limits.programs === 'number') {
    const percent = (usage.programs / limits.programs) * 100;
    if (percent >= ENTERPRISE_TRIGGERS.WARNING_THRESHOLD) {
      return {
        approaching: true,
        metric: 'programs',
        percentUsed: Math.round(percent),
        message: `You're using ${usage.programs} of ${limits.programs} programs (${Math.round(percent)}%).`,
      };
    }
  }

  return { approaching: false, metric: null, percentUsed: 0, message: null };
}

/**
 * Get upgrade path for a plan
 */
export function getUpgradePath(currentPlanId: PlanId): {
  nextPlan: PlanId | 'enterprise';
  message: string;
  ctaText: string;
  ctaHref: string;
} {
  switch (currentPlanId) {
    case 'core':
      return {
        nextPlan: 'institutional',
        message: 'Upgrade to Institutional for more learners, admins, and unlimited programs.',
        ctaText: 'Upgrade to Institutional',
        ctaHref: '/account/billing',
      };
    case 'institutional':
      return {
        nextPlan: 'enterprise',
        message: 'Contact sales to discuss Enterprise licensing for unlimited scale.',
        ctaText: 'Contact Sales',
        ctaHref: '/store/request-license?tier=implementation_plus_annual',
      };
    default:
      return {
        nextPlan: 'enterprise',
        message: 'Contact sales for Enterprise licensing.',
        ctaText: 'Contact Sales',
        ctaHref: '/store/request-license',
      };
  }
}

/**
 * Enterprise feature gates
 * These features require Enterprise license regardless of usage
 */
export const ENTERPRISE_ONLY_FEATURES = [
  'custom_csv_export_schemas',
  'multi_program_outcome_aggregation',
  'funder_by_program_reporting',
  'multi_site_deployment',
  'multi_region_deployment',
  'white_label_branding',
  'compliance_audit_support',
  'dedicated_support',
  'sla_guarantee',
  'source_code_access',
] as const;

export type EnterpriseFeature = (typeof ENTERPRISE_ONLY_FEATURES)[number];

/**
 * Check if a feature requires enterprise
 */
export function requiresEnterprise(feature: string): boolean {
  return ENTERPRISE_ONLY_FEATURES.includes(feature as EnterpriseFeature);
}

/**
 * Get the upgrade message for hitting a limit
 */
export function getLimitReachedMessage(
  limitType: 'students' | 'admins' | 'programs' | 'sites',
  planName: string,
): {
  title: string;
  body: string;
  cta: string;
} {
  switch (limitType) {
    case 'students':
      return {
        title: 'Student Limit Reached',
        body: `You've reached the student limit on your ${planName} plan. New enrollments are paused until you upgrade.`,
        cta: 'Upgrade Now',
      };
    case 'admins':
      return {
        title: 'Admin Limit Reached',
        body: `You've reached the admin user limit on your ${planName} plan. Remove an admin or upgrade to add more.`,
        cta: 'Upgrade Now',
      };
    case 'programs':
      return {
        title: 'Program Limit Reached',
        body: `You've reached the program limit on your ${planName} plan. Upgrade to create more programs.`,
        cta: 'Upgrade Now',
      };
    case 'sites':
      return {
        title: 'Enterprise License Required',
        body: 'Multi-site deployment requires an Enterprise license. Contact sales to continue.',
        cta: 'Contact Sales',
      };
  }
}
