import { OrgConfig } from './getOrgConfig';

export type LimitType = 'students' | 'programs' | 'staff';

/**
 * Check if current count is within org limits
 * Returns true if no limit is set (unlimited)
 */
export function checkLimit(config: OrgConfig, type: LimitType, current: number): boolean {
  const max = config?.limits?.[`max_${type}`];

  if (!max || max === null) {
    return true;
  }

  return current < max;
}
