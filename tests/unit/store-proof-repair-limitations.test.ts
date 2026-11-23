import { describe, expect, it } from 'vitest';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import { PlatformFeature } from '@/lib/platform/features';
import { STORE_FEATURE_PROOFS } from '@/lib/store/offer-proof';

const repairCapabilities = CAPABILITY_CATALOG.filter(
  (capability) => capability.status !== 'internal' && capability.status === 'repair',
);

describe('store offer proof repair limitations', () => {
  it('declares a limitation for every advertised repair capability', () => {
    const missing = repairCapabilities
      .filter((capability) => !STORE_FEATURE_PROOFS[capability.key]?.limitation?.trim())
      .map((capability) => capability.key);

    expect(missing).toEqual([]);
  });

  it('states the staff-only scope of the course creation capabilities', () => {
    expect(repairCapabilities.map((capability) => capability.key)).toEqual(
      expect.arrayContaining([PlatformFeature.COURSE_BUILDER, PlatformFeature.COURSE_FACTORY]),
    );
    expect(STORE_FEATURE_PROOFS[PlatformFeature.COURSE_BUILDER]?.limitation).toMatch(/staff-only/i);
    expect(STORE_FEATURE_PROOFS[PlatformFeature.COURSE_FACTORY]?.limitation).toMatch(/staff-only/i);
  });

  it('keeps repair limitations out of the placeholder wording the contract rejects', () => {
    for (const capability of repairCapabilities) {
      const limitation = STORE_FEATURE_PROOFS[capability.key]?.limitation ?? '';
      expect(limitation.trim().length).toBeGreaterThan(20);
      expect(limitation).not.toMatch(/coming soon|placeholder|todo|tbd|planned feature/i);
    }
  });
});
