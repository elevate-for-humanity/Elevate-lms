import { describe, expect, it } from 'vitest';
import { isUserOnPlatformOwnerTenant } from '@/lib/platform/platform-owner';
import { WORKSPACE_TIER_LIMITS } from '@/lib/workspace/tier-limits';

describe('platform owner tenant helpers', () => {
  it('matches user tenant to platform owner tenant id', () => {
    const ownerId = '11111111-1111-1111-1111-111111111111';
    expect(isUserOnPlatformOwnerTenant(ownerId, ownerId)).toBe(true);
    expect(isUserOnPlatformOwnerTenant('22222222-2222-2222-2222-222222222222', ownerId)).toBe(false);
    expect(isUserOnPlatformOwnerTenant(null, ownerId)).toBe(false);
  });
});

describe('workspace tier limits', () => {
  it('defines builder / pro / agency caps', () => {
    expect(WORKSPACE_TIER_LIMITS.builder.maxWorkspaces).toBe(1);
    expect(WORKSPACE_TIER_LIMITS.pro.customDomains).toBe(true);
    expect(WORKSPACE_TIER_LIMITS.agency.whiteLabel).toBe(true);
  });
});
