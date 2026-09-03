/**
 * License Checkout URLs
 * Maps license types to their store checkout pages
 */

export type LicenseType =
  | 'institution_admin'
  | 'partner_employer'
  | 'workforce_program'
  | 'managed_platform'
  | 'source_use'
  | 'starter'
  | 'pro'
  | 'enterprise';

/**
 * Get the checkout URL for a license type
 */
export function getLicenseCheckoutUrl(licenseType: LicenseType): string {
  const urls: Record<LicenseType, string> = {
    // Demo tour license types
    institution_admin: '/store/licenses/managed-platform',
    partner_employer: '/store/licenses/pro-license',
    workforce_program: '/store/licenses/enterprise-license',

    // Direct license types
    managed_platform: '/store/licenses/managed-platform',
    source_use: '/store/licenses/source-use',
    starter: '/store/licenses/starter-license',
    pro: '/store/licenses/pro-license',
    enterprise: '/store/licenses/enterprise-license',
  };

  return urls[licenseType] || '/store/licenses';
}

/**
 * Get display name for a license type
 */
export function getLicenseDisplayName(licenseType: LicenseType): string {
  const names: Record<LicenseType, string> = {
    institution_admin: 'Institution / Admin License',
    partner_employer: 'Partner / Employer License',
    workforce_program: 'Workforce / Program License',
    managed_platform: 'Managed Platform',
    source_use: 'Source-Use License',
    starter: 'Starter License',
    pro: 'Pro License',
    enterprise: 'Enterprise License',
  };

  return names[licenseType] || 'License';
}

/**
 * Get pricing info for a license type
 */
export function getLicensePricing(licenseType: LicenseType): {
  startingPrice: string;
  billingPeriod: string;
  description: string;
} {
  const pricing: Record<
    LicenseType,
    { startingPrice: string; billingPeriod: string; description: string }
  > = {
    institution_admin: {
      startingPrice: '$1,500',
      billingPeriod: 'month',
      description: 'Full admin control with compliance automation',
    },
    partner_employer: {
      startingPrice: '$500',
      billingPeriod: 'month',
      description: 'Employer portal with candidate pipeline access',
    },
    workforce_program: {
      startingPrice: '$75,000',
      billingPeriod: 'one-time',
      description: 'Enterprise source-use with full customization',
    },
    managed_platform: {
      startingPrice: '$1,500',
      billingPeriod: 'month',
      description: 'Fully managed platform with support',
    },
    source_use: {
      startingPrice: '$75,000',
      billingPeriod: 'one-time',
      description: 'Self-hosted with source code access',
    },
    starter: {
      startingPrice: '$299',
      billingPeriod: 'month',
      description: 'Essential features for small programs',
    },
    pro: {
      startingPrice: '$799',
      billingPeriod: 'month',
      description: 'Advanced features with integrations',
    },
    enterprise: {
      startingPrice: 'Custom',
      billingPeriod: 'annual',
      description: 'Full platform with dedicated support',
    },
  };

  return (
    pricing[licenseType] || { startingPrice: 'Contact us', billingPeriod: '', description: '' }
  );
}

/**
 * Get the implementation call booking URL
 */
export function getImplementationCallUrl(): string {
  return '/schedule';
}
