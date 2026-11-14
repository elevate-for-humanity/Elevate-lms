import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sanitizePlatformValue } from '@/lib/config/sanitize-platform-value';

const FALLBACK_ORG_NAME = 'Elevate for Humanity';

/** Resolved org name safe for public HTML (never a raw PLATFORM_DEFAULTS placeholder). */
export function getPublicOrgName(): string {
  return sanitizePlatformValue(PLATFORM_DEFAULTS.orgName, FALLBACK_ORG_NAME);
}
