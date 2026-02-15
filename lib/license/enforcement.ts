/**
 * License Enforcement
 * 
 * Server-side enforcement of license limits.
 * These functions should be called before any action that could exceed limits.
 */

import { PlanId, PLANS, LicenseStatus } from './types';
import { checkLimits, UsageMetrics, requiresEnterprise } from './limits';

export interface EnforcementResult {
  allowed: boolean;
  reason: string | null;
  upgradeRequired: boolean;
  redirectTo: string | null;
}

/**
 * Check if a new student enrollment is allowed
 */
export function canEnrollStudent(
  planId: PlanId,
  status: LicenseStatus,
  currentStudentCount: number
): EnforcementResult {
  // Check license status first
  if (status === 'suspended' || status === 'canceled') {
    return {
      allowed: false,
      reason: 'License is not active. Please reactivate to enroll students.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  const plan = PLANS[planId];
  if (!plan) {
    return {
      allowed: false,
      reason: 'Invalid license plan.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  // Check student limit
  if (typeof plan.limits.students === 'number') {
    if (currentStudentCount >= plan.limits.students) {
      return {
        allowed: false,
        reason: `You've reached the ${plan.limits.students} student limit on your ${plan.name} plan. Contact sales to continue.`,
        upgradeRequired: true,
        redirectTo: plan.category === 'self_serve' 
          ? '/account/billing' 
          : '/store/request-license?tier=implementation_plus_annual',
      };
    }
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Check if a new admin user can be added
 */
export function canAddAdmin(
  planId: PlanId,
  status: LicenseStatus,
  currentAdminCount: number
): EnforcementResult {
  if (status === 'suspended' || status === 'canceled') {
    return {
      allowed: false,
      reason: 'License is not active.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  const plan = PLANS[planId];
  if (!plan) {
    return {
      allowed: false,
      reason: 'Invalid license plan.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  if (typeof plan.limits.admins === 'number') {
    if (currentAdminCount >= plan.limits.admins) {
      return {
        allowed: false,
        reason: `You've reached the ${plan.limits.admins} admin limit on your ${plan.name} plan.`,
        upgradeRequired: true,
        redirectTo: plan.category === 'self_serve'
          ? '/account/billing'
          : '/store/request-license?tier=implementation_plus_annual',
      };
    }
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Check if a new program can be created
 */
export function canCreateProgram(
  planId: PlanId,
  status: LicenseStatus,
  currentProgramCount: number
): EnforcementResult {
  if (status === 'suspended' || status === 'canceled') {
    return {
      allowed: false,
      reason: 'License is not active.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  const plan = PLANS[planId];
  if (!plan) {
    return {
      allowed: false,
      reason: 'Invalid license plan.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  if (typeof plan.limits.programs === 'number') {
    if (currentProgramCount >= plan.limits.programs) {
      return {
        allowed: false,
        reason: `You've reached the ${plan.limits.programs} program limit on your ${plan.name} plan.`,
        upgradeRequired: true,
        redirectTo: '/account/billing',
      };
    }
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Check if an enterprise-only feature can be accessed
 */
export function canAccessFeature(
  planId: PlanId,
  status: LicenseStatus,
  feature: string
): EnforcementResult {
  if (status === 'suspended' || status === 'canceled') {
    return {
      allowed: false,
      reason: 'License is not active.',
      upgradeRequired: true,
      redirectTo: '/store',
    };
  }

  // Check if feature requires enterprise
  if (requiresEnterprise(feature)) {
    const plan = PLANS[planId];
    if (plan?.category !== 'enterprise') {
      return {
        allowed: false,
        reason: `${feature.replace(/_/g, ' ')} requires an Enterprise license.`,
        upgradeRequired: true,
        redirectTo: '/store/request-license?tier=implementation_plus_annual',
      };
    }
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Check if multi-site deployment is allowed
 */
export function canDeployMultiSite(planId: PlanId): EnforcementResult {
  const plan = PLANS[planId];
  
  if (plan?.category !== 'enterprise') {
    return {
      allowed: false,
      reason: 'Multi-site deployment requires an Enterprise license.',
      upgradeRequired: true,
      redirectTo: '/store/request-license?tier=implementation_plus_annual',
    };
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Check if compliance/audit features can be accessed
 */
export function canAccessComplianceFeatures(planId: PlanId): EnforcementResult {
  const plan = PLANS[planId];
  
  if (plan?.category !== 'enterprise') {
    return {
      allowed: false,
      reason: 'Compliance and audit support requires an Enterprise license.',
      upgradeRequired: true,
      redirectTo: '/store/request-license?tier=implementation_plus_annual',
    };
  }

  return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
}

/**
 * Get overall license health check
 */
export function getLicenseHealth(
  planId: PlanId,
  status: LicenseStatus,
  usage: UsageMetrics
): {
  healthy: boolean;
  warnings: string[];
  blockers: string[];
  recommendedAction: string | null;
} {
  const warnings: string[] = [];
  const blockers: string[] = [];

  // Check status
  if (status === 'suspended') {
    blockers.push('License is suspended. Payment required to continue.');
  } else if (status === 'canceled') {
    blockers.push('License is canceled.');
  } else if (status === 'past_due') {
    warnings.push('Payment is past due. Please update your billing information.');
  }

  // Check limits
  const limitCheck = checkLimits(planId, usage);
  if (!limitCheck.withinLimits && limitCheck.message) {
    blockers.push(limitCheck.message);
  } else if (limitCheck.percentUsed >= 80) {
    warnings.push(`You're using ${limitCheck.percentUsed}% of your plan limits.`);
  }

  // Determine recommended action
  let recommendedAction: string | null = null;
  if (blockers.length > 0) {
    if (status === 'suspended' || status === 'past_due') {
      recommendedAction = 'Update payment method';
    } else {
      recommendedAction = 'Upgrade your plan';
    }
  } else if (warnings.length > 0) {
    recommendedAction = 'Consider upgrading soon';
  }

  return {
    healthy: blockers.length === 0,
    warnings,
    blockers,
    recommendedAction,
  };
}

/**
 * Middleware helper - check if request should be blocked
 */
export function shouldBlockRequest(
  planId: PlanId,
  status: LicenseStatus,
  action: 'enroll_student' | 'add_admin' | 'create_program' | 'export_data' | 'access_compliance',
  currentCounts: Partial<UsageMetrics>
): EnforcementResult {
  switch (action) {
    case 'enroll_student':
      return canEnrollStudent(planId, status, currentCounts.activeStudents || 0);
    case 'add_admin':
      return canAddAdmin(planId, status, currentCounts.adminUsers || 0);
    case 'create_program':
      return canCreateProgram(planId, status, currentCounts.programs || 0);
    case 'export_data':
      return canAccessFeature(planId, status, 'custom_csv_export_schemas');
    case 'access_compliance':
      return canAccessComplianceFeatures(planId);
    default:
      return { allowed: true, reason: null, upgradeRequired: false, redirectTo: null };
  }
}
