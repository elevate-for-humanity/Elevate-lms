/**
 * Access Control Matrix
 *
 * Defines what features are available in each license state.
 * Trial users can experience the system, not operate it.
 */

import { LicenseState } from './license-state';

export type FeatureKey =
  // Navigation & UI
  | 'ui_navigation'
  | 'eligibility_pathway_flow'
  | 'program_setup'
  | 'admin_dashboard'
  | 'reporting_view'
  | 'branding_preview'
  // Production features (licensed only)
  | 'production_data_export'
  | 'bulk_imports'
  | 'email_sms_sending'
  | 'certificate_issuance'
  | 'integrations'
  | 'multi_admin_creation'
  | 'environment_secrets'
  | 'reporting_export'
  | 'employer_workflows'
  | 'branding_replacement'
  | 'environment_configuration';

interface FeatureAccess {
  trial: boolean;
  licensed: boolean;
  expired: boolean;
  description: string;
}

/**
 * Feature access matrix
 * true = allowed, false = blocked
 */
export const FEATURE_ACCESS: Record<FeatureKey, FeatureAccess> = {
  // TRIAL: Unlocked
  ui_navigation: {
    trial: true,
    licensed: true,
    expired: false, // Read-only in expired
    description: 'Full UI navigation',
  },
  eligibility_pathway_flow: {
    trial: true,
    licensed: true,
    expired: false,
    description: 'Eligibility → pathway flow',
  },
  program_setup: {
    trial: true, // Limited
    licensed: true,
    expired: false,
    description: 'Program setup (limited in trial)',
  },
  admin_dashboard: {
    trial: true, // Read/write with caps
    licensed: true,
    expired: false, // Read-only
    description: 'Admin dashboard',
  },
  reporting_view: {
    trial: true, // View only
    licensed: true,
    expired: false,
    description: 'Reporting (view only in trial)',
  },
  branding_preview: {
    trial: true, // Not exportable
    licensed: true,
    expired: false,
    description: 'Branding preview',
  },

  // TRIAL: Restricted (Licensed only)
  production_data_export: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Production data export',
  },
  bulk_imports: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Bulk data imports',
  },
  email_sms_sending: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Email/SMS sending',
  },
  certificate_issuance: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Certificate issuance',
  },
  integrations: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'External integrations (Stripe, LMS, etc.)',
  },
  multi_admin_creation: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Multi-admin creation',
  },
  environment_secrets: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Environment secrets access',
  },
  reporting_export: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Reporting exports (CSV/PDF)',
  },
  employer_workflows: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Employer workflows',
  },
  branding_replacement: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Full branding replacement',
  },
  environment_configuration: {
    trial: false,
    licensed: true,
    expired: false,
    description: 'Environment configuration',
  },
};

/**
 * Check if a feature is accessible for a given license state
 */
export function canAccessFeature(feature: FeatureKey, state: LicenseState): boolean {
  const access = FEATURE_ACCESS[feature];
  if (!access) return false;
  return access[state];
}

/**
 * Get all accessible features for a license state
 */
export function getAccessibleFeatures(state: LicenseState): FeatureKey[] {
  return (Object.keys(FEATURE_ACCESS) as FeatureKey[]).filter(
    (feature) => FEATURE_ACCESS[feature][state],
  );
}

/**
 * Get all restricted features for a license state
 */
export function getRestrictedFeatures(state: LicenseState): FeatureKey[] {
  return (Object.keys(FEATURE_ACCESS) as FeatureKey[]).filter(
    (feature) => !FEATURE_ACCESS[feature][state],
  );
}

/**
 * Get restriction message for a feature
 */
export function getRestrictionMessage(feature: FeatureKey, state: LicenseState): string | null {
  if (canAccessFeature(feature, state)) return null;

  const featureInfo = FEATURE_ACCESS[feature];

  if (state === 'trial') {
    return `${featureInfo.description} is not available during the trial. Request a license to unlock this feature.`;
  }

  if (state === 'expired') {
    return `Your trial has expired. Request a license to continue using ${featureInfo.description.toLowerCase()}.`;
  }

  return `${featureInfo.description} is not available with your current license.`;
}

/**
 * Guard function - throws if feature not accessible
 */
export function requireFeatureAccess(feature: FeatureKey, state: LicenseState): void {
  if (!canAccessFeature(feature, state)) {
    const message = getRestrictionMessage(feature, state);
    throw new Error(message || 'Feature not accessible');
  }
}

/**
 * Check if any admin actions are allowed
 */
export function canPerformAdminActions(state: LicenseState): boolean {
  return state === 'trial' || state === 'licensed';
}

/**
 * Check if in read-only mode (expired state)
 */
export function isReadOnlyMode(state: LicenseState): boolean {
  return state === 'expired';
}
