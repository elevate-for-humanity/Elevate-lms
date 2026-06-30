import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// Brand configuration for governance pages
export type Brand = 'elevate';

export interface BrandConfig {
  name: string;
  shortName: string;
  domain: string;
  canonicalDomain: string;
  primaryColor: string;
  accentColor: string;
}

export const brandConfigs: Record<Brand, BrandConfig> = {
  elevate: {
    name: PLATFORM_DEFAULTS.orgName,
    shortName: 'Elevate',
    domain: PLATFORM_DEFAULTS.canonicalDomain,
    canonicalDomain: PLATFORM_DEFAULTS.canonicalDomain,
    primaryColor: 'blue',
    accentColor: 'slate',
  },};

// Canonical domain helper for governance links
export function getCanonicalUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  return `${base}${path}`;
}

export function getBrandFromHost(host: string): Brand {
  return 'elevate';
}
