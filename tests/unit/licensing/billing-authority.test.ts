import { describe, it, expect } from 'vitest';
import { 
  isLicenseActiveNow, 
  isSubscriptionTier, 
  getBillingAuthority,
  isKnownTier,
  tierRequiresExpiry,
  tierAllowsPerpetual,
  getLicenseAccessMode,
  isAdminRole,
  type License 
} from '@/lib/licensing/billing-authority';

describe('billing-authority', () => {
  const now = new Date('2026-01-27T12:00:00Z');
  const future = new Date('2026-02-15T12:00:00Z');
  const past = new Date('2026-01-01T12:00:00Z');

  describe('Tier Classification', () => {
    describe('isSubscriptionTier', () => {
      it('returns true for subscription tiers', () => {
        expect(isSubscriptionTier('managed_monthly')).toBe(true);
        expect(isSubscriptionTier('managed_annual')).toBe(true);
        expect(isSubscriptionTier('pro_monthly')).toBe(true);
      });

      it('returns false for DB tiers', () => {
        expect(isSubscriptionTier('trial')).toBe(false);
        expect(isSubscriptionTier('lifetime')).toBe(false);
        expect(isSubscriptionTier('basic')).toBe(false);
      });

      it('returns false for null/undefined', () => {
        expect(isSubscriptionTier(null)).toBe(false);
        expect(isSubscriptionTier(undefined)).toBe(false);
      });
    });

    describe('isKnownTier', () => {
      it('returns true for known tiers', () => {
        expect(isKnownTier('trial')).toBe(true);
        expect(isKnownTier('lifetime')).toBe(true);
        expect(isKnownTier('managed_monthly')).toBe(true);
      });

      it('returns false for unknown tiers', () => {
        expect(isKnownTier('typo_tier')).toBe(false);
        expect(isKnownTier('random')).toBe(false);
        expect(isKnownTier('')).toBe(false);
      });
    });

    describe('tierRequiresExpiry', () => {
      it('returns true for trial, pilot, grant', () => {
        expect(tierRequiresExpiry('trial')).toBe(true);
        expect(tierRequiresExpiry('pilot')).toBe(true);
        expect(tierRequiresExpiry('grant')).toBe(true);
      });

      it('returns false for perpetual tiers', () => {
        expect(tierRequiresExpiry('lifetime')).toBe(false);
        expect(tierRequiresExpiry('one_time')).toBe(false);
      });
    });

    describe('getBillingAuthority', () => {
      it('returns stripe for subscription tiers', () => {
        expect(getBillingAuthority('managed_monthly')).toBe('stripe');
      });

      it('returns database for DB tiers', () => {
        expect(getBillingAuthority('trial')).toBe('database');
        expect(getBillingAuthority('lifetime')).toBe('database');
      });
    });
  });

  describe('isLicenseActiveNow - Trial (DB-authoritative, requires expiry)', () => {
    it('allows trial with future expires_at', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('db_active');
      expect(result.authority).toBe('database');
    });

    it('denies trial with past expires_at', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: past.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('license_expired');
      expect(result.authority).toBe('database');
    });

    it('denies trial with NO expires_at (no perpetual trials)', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: null,
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_expires_at');
    });

    it('denies trial with expires_at exactly at now (boundary)', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: now.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('license_expired');
    });
  });

  describe('isLicenseActiveNow - Lifetime (DB-authoritative, perpetual allowed)', () => {
    it('allows lifetime with no expires_at', () => {
      const license: License = {
        status: 'active',
        tier: 'lifetime',
        expires_at: null,
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('db_perpetual');
    });

    it('allows lifetime with future expires_at', () => {
      const license: License = {
        status: 'active',
        tier: 'lifetime',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('db_active');
    });
  });

  describe('isLicenseActiveNow - Subscription (Stripe-authoritative)', () => {
    it('allows subscription with valid data and future cpe', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: future.toISOString(),
        stripe_subscription_id: 'sub_123',
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('subscription_active');
      expect(result.authority).toBe('stripe');
    });

    it('denies subscription with missing stripe_subscription_id', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: future.toISOString(),
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_subscription_id');
    });

    it('denies subscription with missing current_period_end', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: null,
        stripe_subscription_id: 'sub_123',
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_current_period_end');
    });

    it('denies subscription with past current_period_end', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: past.toISOString(),
        stripe_subscription_id: 'sub_123',
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('subscription_expired');
    });

    it('denies subscription with cpe exactly at now (boundary)', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: now.toISOString(),
        stripe_subscription_id: 'sub_123',
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('subscription_expired');
    });
  });

  describe('isLicenseActiveNow - Unknown tier (fail closed)', () => {
    it('denies unknown tier with status active', () => {
      const license: License = {
        status: 'active',
        tier: 'typo_tier',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unknown_tier');
    });

    it('denies unknown tier with null expires_at (prevents perpetual)', () => {
      const license: License = {
        status: 'active',
        tier: 'random_tier',
        expires_at: null,
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unknown_tier');
    });

    it('denies empty tier', () => {
      const license: License = {
        status: 'active',
        tier: '',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('unknown_tier');
    });
  });

  describe('isLicenseActiveNow - Lifecycle flags (canceled_at, suspended_at)', () => {
    it('denies license with canceled_at set (even if status=active)', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
        canceled_at: past.toISOString(),
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('license_canceled');
    });

    it('denies license with suspended_at set (even if status=active)', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: future.toISOString(),
        stripe_subscription_id: 'sub_123',
        suspended_at: past.toISOString(),
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('license_suspended');
    });
  });

  describe('isLicenseActiveNow - Status checks', () => {
    it('denies inactive status', () => {
      const license: License = {
        status: 'suspended',
        tier: 'trial',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('status_suspended');
    });

    it('denies null license', () => {
      const result = isLicenseActiveNow(null, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('no_license');
    });

    it('denies undefined license', () => {
      const result = isLicenseActiveNow(undefined, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('no_license');
    });
  });

  describe('isLicenseActiveNow - Invalid date handling', () => {
    it('treats invalid expires_at as null', () => {
      const license: License = {
        status: 'active',
        tier: 'lifetime', // perpetual allowed
        expires_at: 'not-a-date',
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(true);
      expect(result.reason).toBe('db_perpetual');
    });

    it('denies trial with invalid expires_at (requires expiry)', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: 'invalid',
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_expires_at');
    });

    it('denies subscription with invalid current_period_end', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: 'invalid',
        stripe_subscription_id: 'sub_123',
      };
      const result = isLicenseActiveNow(license, now);
      expect(result.ok).toBe(false);
      expect(result.reason).toBe('missing_current_period_end');
    });
  });

  describe('isAdminRole', () => {
    it('returns true for admin roles', () => {
      expect(isAdminRole('super_admin')).toBe(true);
      expect(isAdminRole('admin')).toBe(true);
      expect(isAdminRole('org_admin')).toBe(true);
      expect(isAdminRole('executive')).toBe(true);
    });

    it('returns false for non-admin roles', () => {
      expect(isAdminRole('student')).toBe(false);
      expect(isAdminRole('learner')).toBe(false);
      expect(isAdminRole('instructor')).toBe(false);
      expect(isAdminRole(null)).toBe(false);
      expect(isAdminRole(undefined)).toBe(false);
    });
  });

  describe('getLicenseAccessMode', () => {
    it('returns full access for active license', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: future.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = getLicenseAccessMode(license, 'admin', now);
      expect(result.mode).toBe('full');
      expect(result.canRead).toBe(true);
      expect(result.canMutate).toBe(true);
    });

    it('returns admin_readonly_hold for expired trial + admin', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: past.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = getLicenseAccessMode(license, 'admin', now);
      expect(result.mode).toBe('admin_readonly_hold');
      expect(result.canRead).toBe(true);
      expect(result.canMutate).toBe(false);
      expect(result.message).toContain('billing hold');
    });

    it('returns blocked for expired trial + non-admin', () => {
      const license: License = {
        status: 'active',
        tier: 'trial',
        expires_at: past.toISOString(),
        current_period_end: null,
        stripe_subscription_id: null,
      };
      const result = getLicenseAccessMode(license, 'student', now);
      expect(result.mode).toBe('blocked');
      expect(result.canRead).toBe(false);
      expect(result.canMutate).toBe(false);
      expect(result.redirectTo).toBe('/access-paused');
      expect(result.message).toContain('contact your administrator');
    });

    it('returns blocked_billing_issue for canceled license', () => {
      const license: License = {
        status: 'active',
        tier: 'managed_monthly',
        expires_at: null,
        current_period_end: future.toISOString(),
        stripe_subscription_id: 'sub_123',
        canceled_at: past.toISOString(),
      };
      const result = getLicenseAccessMode(license, 'admin', now);
      expect(result.mode).toBe('blocked_billing_issue');
      expect(result.canRead).toBe(false);
      expect(result.canMutate).toBe(false);
    });

    it('returns blocked for no license (non-admin)', () => {
      const result = getLicenseAccessMode(null, 'student', now);
      expect(result.mode).toBe('blocked');
      expect(result.redirectTo).toContain('reason=missing');
    });

    it('returns full for admin with no license (admin bypass)', () => {
      // Admins always get access so they can fix licensing issues.
      const result = getLicenseAccessMode(null, 'admin', now);
      expect(result.mode).toBe('full');
      expect(result.reason).toBe('no_license_admin_bypass');
    });
  });
});
