import rawBranding from '../config/branding.json';

export type BrandingConfig = {
  appName: string;
  primaryColor: string;
  logoPath: string;
};

const defaultBranding: BrandingConfig = {
  appName: 'Elevate Workforce Platform',
  primaryColor: '#EA580C',
  logoPath: '/branding/logo.png',
};

export function getBranding(): BrandingConfig {
  try {
    const b = rawBranding as Partial<BrandingConfig>;
    return {
      appName: b.appName || defaultBranding.appName,
      primaryColor: b.primaryColor || defaultBranding.primaryColor,
      logoPath: b.logoPath || defaultBranding.logoPath,
    };
  } catch (err) {
    // Error: $1
    return defaultBranding;
  }
}

/**
 * Optional helper: use this if you want branded page titles.
 * Example: applyBrandingToTitle("Programs") => "Region 5 Workforce Hub | Programs"
 */
export function applyBrandingToTitle(baseTitle: string): string {
  const b = getBranding();
  return `${b.appName} | ${baseTitle}`;
}
