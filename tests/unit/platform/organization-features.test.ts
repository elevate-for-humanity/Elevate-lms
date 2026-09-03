import { describe, expect, it } from 'vitest';
import {
  organizationHasFeature,
  type OrganizationEntitlements,
} from '@/lib/platform/organization-features';
import { FEATURES } from '@/lib/platform/feature-catalog';

function ent(features: string[]): OrganizationEntitlements {
  return {
    organizationId: 'test-org',
    planSlug: 'solo',
    planName: 'Solo',
    status: 'active',
    features: features as OrganizationEntitlements['features'],
    limits: { users: 1 },
    activeAddonCodes: [],
    currentPeriodEnd: null,
  };
}

describe('organizationHasFeature', () => {
  it('detects workforce add-on feature', () => {
    expect(organizationHasFeature(ent([FEATURES.WORKFORCE]), FEATURES.WORKFORCE)).toBe(true);
  });

  it('maps booking alias', () => {
    expect(organizationHasFeature(ent(['booking']), FEATURES.BOOKINGS)).toBe(true);
  });

  it('denies missing premium modules', () => {
    expect(organizationHasFeature(ent([FEATURES.CRM]), FEATURES.APPRENTICESHIP)).toBe(false);
  });
});
