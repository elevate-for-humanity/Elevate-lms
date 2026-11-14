import { OrgConfig } from './getOrgConfig';

/**
 * Check if a feature is enabled in org config
 * Uses dot notation path (e.g., 'features.micro_courses')
 * Falls back to true if config path doesn't exist (backward compatible)
 */
export function featureEnabled(config: OrgConfig, path: string, fallback = true): boolean {
  const keys = path.split('.');
  let current: any = config;

  for (const key of keys) {
    if (current?.[key] === undefined) {
      return fallback;
    }
    current = current[key];
  }

  return Boolean(current);
}
