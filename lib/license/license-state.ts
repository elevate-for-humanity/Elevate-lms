/**
 * License State Management
 *
 * Controls access to platform features based on license status.
 * Trial → Licensed → Expired flow with clear gating.
 */

export type LicenseState = 'trial' | 'licensed' | 'expired';

export type OrganizationType =
  | 'workforce_board'
  | 'training_provider'
  | 'nonprofit'
  | 'government'
  | 'apprenticeship_sponsor'
  | 'other';

export interface LicenseInfo {
  state: LicenseState;
  trialStartedAt: Date | null;
  trialExpiresAt: Date | null;
  licensedAt: Date | null;
  organizationName: string;
  organizationType: OrganizationType;
  contactEmail: string;
  contactName: string;
}

// Default trial length in days
export const TRIAL_LENGTH_DAYS = 14;

/**
 * Calculate trial expiration date from start date
 */
export function calculateTrialExpiration(startDate: Date): Date {
  const expiration = new Date(startDate);
  expiration.setDate(expiration.getDate() + TRIAL_LENGTH_DAYS);
  return expiration;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Determine current license state based on dates
 */
export function determineLicenseState(info: Partial<LicenseInfo>): LicenseState {
  if (info.licensedAt) {
    return 'licensed';
  }

  if (info.trialStartedAt && info.trialExpiresAt) {
    if (isTrialExpired(info.trialExpiresAt)) {
      return 'expired';
    }
    return 'trial';
  }

  return 'expired';
}

/**
 * Create a new trial license info
 */
export function createTrialLicense(
  organizationName: string,
  organizationType: OrganizationType,
  contactName: string,
  contactEmail: string,
): LicenseInfo {
  const now = new Date();
  return {
    state: 'trial',
    trialStartedAt: now,
    trialExpiresAt: calculateTrialExpiration(now),
    licensedAt: null,
    organizationName,
    organizationType,
    contactName,
    contactEmail,
  };
}

/**
 * Upgrade trial to licensed
 */
export function upgradeToLicense(info: LicenseInfo): LicenseInfo {
  return {
    ...info,
    state: 'licensed',
    licensedAt: new Date(),
  };
}

/**
 * Get human-readable license status message
 */
export function getLicenseStatusMessage(state: LicenseState, expiresAt: Date | null): string {
  switch (state) {
    case 'trial':
      const days = getTrialDaysRemaining(expiresAt);
      return `Trial mode — ${days} day${days !== 1 ? 's' : ''} remaining`;
    case 'expired':
      return 'Trial expired — request a license to continue';
    case 'licensed':
      return '';
  }
}

/**
 * Get banner type for UI display
 */
export function getLicenseBannerType(state: LicenseState): 'info' | 'warning' | 'error' | null {
  switch (state) {
    case 'trial':
      return 'info';
    case 'expired':
      return 'error';
    case 'licensed':
      return null;
  }
}
