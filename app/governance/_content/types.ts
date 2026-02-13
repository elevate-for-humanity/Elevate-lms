// Brand configuration for governance pages
export type Brand = 'elevate' | 'supersonic';

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
  supersonic: {
    name: 'Supersonic Fast Cash',
    shortName: 'Supersonic',
    domain: 'www.supersonicfastermoney.com',
    canonicalDomain: 'www.elevateforhumanity.org', // Always canonical to Elevate
    primaryColor: 'emerald',
    accentColor: 'slate',
  },
};

// Supersonic domain constant for middleware matching
export const SUPERSONIC_GOVERNANCE_DOMAIN = 'supersonicfastermoney.com';

export function getCanonicalUrl(path: string): string {
  // All governance pages canonical to Elevate
  return `https://www.elevateforhumanity.org${path}`;
}

export function getBrandFromHost(host: string): Brand {
  if (host.includes(SUPERSONIC_GOVERNANCE_DOMAIN)) {
    return 'supersonic';
  }
  return 'elevate';
}
