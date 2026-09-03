import { describe, expect, it } from 'vitest';
import { resolveEntitlements, hasPlatformFeature } from '@/lib/platform/entitlements';
import { PlatformFeature } from '@/lib/platform/features';

describe('resolveEntitlements', () => {
  it('solo plan includes CRM and not LMS', () => {
    const e = resolveEntitlements('solo', []);
    expect(e.features).toContain(PlatformFeature.CRM);
    expect(e.features).not.toContain(PlatformFeature.LMS);
    expect(e.maxUsers).toBe(1);
  });

  it('professional includes LMS', () => {
    const e = resolveEntitlements('professional', []);
    expect(e.features).toContain(PlatformFeature.LMS);
    expect(e.maxUsers).toBe(10);
  });

  it('merges add-on features', () => {
    const e = resolveEntitlements('solo', ['workforce-development', 'ai-addon']);
    expect(e.features).toContain(PlatformFeature.WORKFORCE);
    expect(e.features).toContain(PlatformFeature.AI_ADVANCED);
  });

  it('additional-user increases seat count', () => {
    const e = resolveEntitlements('business', ['additional-user', 'additional-user']);
    expect(e.maxUsers).toBe(5);
  });
});

describe('hasPlatformFeature', () => {
  it('returns true when feature present', () => {
    expect(hasPlatformFeature(['crm', 'website'], PlatformFeature.CRM)).toBe(true);
  });
  it('returns false when missing', () => {
    expect(hasPlatformFeature(['crm'], PlatformFeature.LMS)).toBe(false);
  });
});
