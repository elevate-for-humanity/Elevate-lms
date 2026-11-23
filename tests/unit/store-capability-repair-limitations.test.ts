import { describe, expect, it } from 'vitest';
import { PlatformFeature } from '@/lib/platform/features';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import { STORE_FEATURE_PROOFS } from '@/lib/store/offer-proof';

const repairCapabilities = CAPABILITY_CATALOG.filter((capability) => capability.status === 'repair');

describe('Store capability repair limitations', () => {
  it('keeps the staff-only course capabilities in the repair state', () => {
    const keys = repairCapabilities.map((capability) => capability.key);
    expect(keys).toContain(PlatformFeature.COURSE_BUILDER);
    expect(keys).toContain(PlatformFeature.COURSE_FACTORY);
  });

  it('states a limitation for every capability sold in the repair state', () => {
    for (const capability of repairCapabilities) {
      const proof = STORE_FEATURE_PROOFS[capability.key];
      expect(proof, `${capability.key} has no Store feature proof`).toBeDefined();
      expect(
        proof?.limitation?.trim().length ?? 0,
        `${capability.key} must state its limitation`,
      ).toBeGreaterThan(20);
    }
  });

  it('names the closed self-service checkout and quoted allowance as the Course Builder limitation', () => {
    expect(STORE_FEATURE_PROOFS[PlatformFeature.COURSE_BUILDER]?.limitation).toMatch(
      /self-service checkout is closed/i,
    );
    expect(STORE_FEATURE_PROOFS[PlatformFeature.COURSE_FACTORY]?.limitation).toMatch(/staff-only/i);
  });
});
