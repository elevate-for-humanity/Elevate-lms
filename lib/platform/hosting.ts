/** Canonical production hosting identifiers. */
import policy from '@/config/google-runtime-policy.json';

export const PRODUCTION_HOSTING_PLATFORM = 'google-cloud-run' as const;
export type ProductionHostingPlatform = typeof PRODUCTION_HOSTING_PLATFORM;

export function getProductionHostingPlatform(): ProductionHostingPlatform {
  return PRODUCTION_HOSTING_PLATFORM;
}

export const GOOGLE_CLOUD_SERVICES = {
  marketing: policy.components.marketing.service,
  lms: policy.components.lms.service,
  admin: policy.components.admin.service,
  store: policy.components.store.service,
} as const;
