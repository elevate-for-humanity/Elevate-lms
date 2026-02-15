import { NextResponse } from 'next/server';
import { requireActiveLicense, License } from './requireActiveLicense';

/**
 * STEP 5C: Feature Entitlement Enforcement
 * 
 * Features are stored in license.features JSONB:
 * {
 *   "ai_features": true,
 *   "white_label": true,
 *   "custom_domain": false,
 *   "api_access": true,
 *   "advanced_reporting": false,
 *   "bulk_operations": true,
 *   "sso": false,
 *   "priority_support": true
 * }
 */

export type FeatureName = 
  | 'ai_features'
  | 'white_label'
  | 'custom_domain'
  | 'api_access'
  | 'advanced_reporting'
  | 'bulk_operations'
  | 'sso'
  | 'priority_support';

export class FeatureNotEnabledError extends Error {
  public statusCode: number = 403;
  public feature: string;
  
  constructor(feature: string) {
    super(`Feature '${feature}' is not enabled for your license plan. Please upgrade to access this feature.`);
    this.name = 'FeatureNotEnabledError';
    this.feature = feature;
  }
}

export class LimitExceededError extends Error {
  public statusCode: number = 403;
  public limitType: string;
  public current: number;
  public max: number;
  
  constructor(limitType: string, current: number, max: number) {
    super(`${limitType} limit exceeded. Current: ${current}, Maximum: ${max}. Please upgrade your plan.`);
    this.name = 'LimitExceededError';
    this.limitType = limitType;
    this.current = current;
    this.max = max;
  }
}

/**
 * Check if a feature is enabled in the license
 */
export function hasFeature(license: License, feature: FeatureName): boolean {
  return license.features?.[feature] === true;
}

/**
 * Require a specific feature to be enabled
 * 
 * Usage:
 * ```
 * const license = await requireActiveLicense();
 * requireFeature(license, 'white_label');
 * // Continue with white-label functionality
 * ```
 */
export function requireFeature(license: License, feature: FeatureName): void {
  if (!hasFeature(license, feature)) {
    throw new FeatureNotEnabledError(feature);
  }
}

/**
 * Require active license AND specific feature
 * 
 * Usage:
 * ```
 * const license = await requireLicenseWithFeature('api_access');
 * ```
 */
export async function requireLicenseWithFeature(feature: FeatureName): Promise<License> {
  const license = await requireActiveLicense();
  requireFeature(license, feature);
  return license;
}

/**
 * Check limit against license
 */
export function checkLimit(
  license: License,
  limitType: 'users' | 'students' | 'programs',
  currentCount: number
): void {
  const limitMap = {
    users: license.max_users,
    students: license.max_students,
    programs: license.max_programs,
  };
  
  const max = limitMap[limitType];
  
  // null means unlimited
  if (max !== null && currentCount >= max) {
    throw new LimitExceededError(limitType, currentCount, max);
  }
}

/**
 * Create error response for feature/limit errors
 */
export function featureErrorResponse(error: FeatureNotEnabledError | LimitExceededError): NextResponse {
  if (error instanceof FeatureNotEnabledError) {
    return NextResponse.json(
      { 
        error: 'Operation failed',
        code: 'FEATURE_NOT_ENABLED',
        feature: error.feature
      },
      { status: error.statusCode }
    );
  }
  
  return NextResponse.json(
    { 
      error: 'Operation failed',
      code: 'LIMIT_EXCEEDED',
      limitType: error.limitType,
      current: error.current,
      max: error.max
    },
    { status: error.statusCode }
  );
}

/**
 * Get all enabled features for a license
 */
export function getEnabledFeatures(license: License): FeatureName[] {
  if (!license.features) return [];
  
  return Object.entries(license.features)
    .filter(([, enabled]) => enabled === true)
    .map(([feature]) => feature as FeatureName);
}

/**
 * Check multiple features at once
 */
export function hasAllFeatures(license: License, features: FeatureName[]): boolean {
  return features.every(feature => hasFeature(license, feature));
}

/**
 * Check if any of the features are enabled
 */
export function hasAnyFeature(license: License, features: FeatureName[]): boolean {
  return features.some(feature => hasFeature(license, feature));
}
