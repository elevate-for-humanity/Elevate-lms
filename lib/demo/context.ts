/**
 * Demo Context Helpers
 * Server-side utilities for demo mode detection and tenant isolation
 */

export const DEMO_TENANT_SLUG = process.env.DEMO_TENANT_SLUG || 'demo';

/**
 * Check if demo mode is enabled via environment
 */
export function isDemoEnabled(): boolean {
  // Demo mode is enabled if:
  // 1. DEMO_MODE env var is true, OR
  // 2. We're in development/preview and DEMO_ALLOW_IN_PROD is not explicitly false
  const demoMode = process.env.DEMO_MODE === 'true';
  const allowInProd = process.env.DEMO_ALLOW_IN_PROD !== 'false';
  const isProduction = process.env.NODE_ENV === 'production';
  const isNetlifyPreview = process.env.NEXT_PUBLIC_CONTEXT === 'deploy-preview';
  
  if (demoMode) return true;
  if (!isProduction) return true;
  if (isNetlifyPreview && allowInProd) return true;
  
  return allowInProd;
}

/**
 * Get the demo tenant slug
 */
export function getDemoTenantSlug(): string {
  return DEMO_TENANT_SLUG;
}

/**
 * Check if a tenant slug is the demo tenant
 */
export function isDemoTenant(tenantSlug: string | null | undefined): boolean {
  if (!tenantSlug) return false;
  return tenantSlug === DEMO_TENANT_SLUG;
}

/**
 * Assert that we're operating on the demo tenant
 * Throws if not demo tenant (for use in API routes)
 */
export function assertDemoTenant(tenantSlug: string | null | undefined): void {
  if (!isDemoTenant(tenantSlug)) {
    throw new Error('Operation only allowed on demo tenant');
  }
}

/**
 * Demo user roles
 */
export type DemoRole = 'demo_admin' | 'demo_staff' | 'demo_partner' | 'demo_learner' | 'super_admin';

/**
 * Demo user credentials (for display in role switcher)
 */
export const DEMO_USERS = {
  demo_admin: {
    email: 'demo-admin@elevateforhumanity.org',
    name: 'Demo Admin',
    role: 'demo_admin' as DemoRole,
    description: 'Full administrative access to manage programs, students, and settings',
  },
  demo_staff: {
    email: 'demo-staff@elevateforhumanity.org',
    name: 'Demo Staff',
    role: 'demo_staff' as DemoRole,
    description: 'Staff access for enrollment processing and student support',
  },
  demo_partner: {
    email: 'demo-partner@elevateforhumanity.org',
    name: 'Demo Partner',
    role: 'demo_partner' as DemoRole,
    description: 'Employer/partner portal access for hiring and apprenticeship management',
  },
  demo_learner: {
    email: 'demo-learner@elevateforhumanity.org',
    name: 'Demo Learner',
    role: 'demo_learner' as DemoRole,
    description: 'Student LMS access for courses, progress tracking, and certificates',
  },
};

/**
 * License types for demo tours
 */
export type DemoLicenseType = 'institution_admin' | 'partner_employer' | 'workforce_program';

/**
 * Map license types to store checkout URLs
 */
export function getLicenseCheckoutUrl(licenseType: DemoLicenseType): string {
  const urls: Record<DemoLicenseType, string> = {
    institution_admin: '/store/licenses/managed-platform',
    partner_employer: '/store/licenses/managed-platform',
    workforce_program: '/store/licenses/source-use',
  };
  return urls[licenseType];
}

/**
 * Map license types to display names
 */
export function getLicenseDisplayName(licenseType: DemoLicenseType): string {
  const names: Record<DemoLicenseType, string> = {
    institution_admin: 'Managed Platform',
    partner_employer: 'Managed Platform (Employer)',
    workforce_program: 'Enterprise Source-Use',
  };
  return names[licenseType];
}
