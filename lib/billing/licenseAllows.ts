import { OrgConfig } from '@/lib/org/getOrgConfig';

/**
 * Check if license allows a specific feature
 * Used for admin/creation features only, never student learning
 */
export function licenseAllows(config: OrgConfig, feature: string): boolean {
  // If no license config, allow everything (backward compatible)
  if (!config?.license?.features) {
    return true;
  }

  return (config as any).license.features[feature] !== false;
}
