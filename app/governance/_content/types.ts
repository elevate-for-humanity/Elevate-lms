// Brand configuration for governance pages
export type Brand = 'elevate' | 'elevate';

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
    name: 'Elevate for Humanity',
    shortName: 'Elevate',
    domain: 'www.elevateforhumanity.org',
    canonicalDomain: 'www.elevateforhumanity.org',
    primaryColor: 'blue',
    accentColor: 'slate',
  },
  elevate: {
    name: 'Elevate Tax Services',
    shortName: 'Elevate Tax',
    domain: 'www.elevateforhumanity.org',
    canonicalDomain: 'www.elevateforhumanity.org', // Always canonical to Elevate
    primaryColor: 'emerald',
    accentColor: 'slate',
  },
};

// Elevate domain constant for middleware matching
export const ELEVATE_GOVERNANCE_DOMAIN = '';

export function getCanonicalUrl(path: string): string {
  // All governance pages canonical to Elevate
  return `https://www.elevateforhumanity.org${path}`;
}

export function getBrandFromHost(host: string): Brand {
  if (host.includes(ELEVATE_GOVERNANCE_DOMAIN)) {
    return 'elevate';
  }
  return 'elevate';
}
