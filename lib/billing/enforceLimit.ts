import { OrgConfig } from '@/lib/org/getOrgConfig';

export type LimitType = 'students' | 'staff' | 'programs';

/**
 * Enforce license limits
 * Throws error if limit exceeded
 * Used in creation/invite flows only
 */
export function enforceLimit(config: OrgConfig, current: number, type: LimitType): void {
  const max = config?.license?.limits?.[`max_${type}`];

  // No limit set = unlimited
  if (!max || max === null) {
    return;
  }

  if (current >= max) {
    throw new Error(
      `License limit reached: ${type} (${current}/${max}). Please upgrade your plan.`,
    );
  }
}

/**
 * Check if limit would be exceeded without throwing
 */
export function wouldExceedLimit(config: OrgConfig, current: number, type: LimitType): boolean {
  const max = config?.license?.limits?.[`max_${type}`];

  if (!max || max === null) {
    return false;
  }

  return current >= max;
}
