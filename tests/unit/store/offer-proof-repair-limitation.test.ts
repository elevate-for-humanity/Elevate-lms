import { describe, expect, it } from 'vitest';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import { PlatformFeature } from '@/lib/platform/features';
import { STORE_FEATURE_PROOFS } from '@/lib/store/offer-proof';

// Regression: production release 45152971417 failed the readiness gate because
// Course Builder and AI Course Factory moved to `repair` status while their
// Store proofs still advertised them without a limitation.
const PLACEHOLDER_LANGUAGE = /coming soon|placeholder|todo|tbd|planned feature/i;

describe('Store proofs for repair-status capabilities', () => {
  const repairCapabilities = CAPABILITY_CATALOG.filter(
    (capability) => capability.status === 'repair',
  );

  it('covers the two capabilities that broke the readiness gate', () => {
    const keys = repairCapabilities.map((capability) => capability.key);
    expect(keys).toContain(PlatformFeature.COURSE_BUILDER);
    expect(keys).toContain(PlatformFeature.COURSE_FACTORY);
  });

  it('declares a concrete limitation on every repair-status proof', () => {
    const missing = repairCapabilities
      .filter((capability) => {
        const limitation = STORE_FEATURE_PROOFS[capability.key]?.limitation?.trim() ?? '';
        return limitation.length < 20;
      })
      .map((capability) => String(capability.key));

    expect(missing).toEqual([]);
  });

  it('keeps repair limitations free of placeholder or future-tense language', () => {
    const withPlaceholders = repairCapabilities
      .filter((capability) =>
        PLACEHOLDER_LANGUAGE.test(STORE_FEATURE_PROOFS[capability.key]?.limitation ?? ''),
      )
      .map((capability) => String(capability.key));

    expect(withPlaceholders).toEqual([]);
  });

  it('states the closed self-service checkout for Course Builder', () => {
    const limitation = STORE_FEATURE_PROOFS[PlatformFeature.COURSE_BUILDER]?.limitation ?? '';
    expect(limitation).toMatch(/self-service checkout is closed/i);
  });

  it('states the credit cost and human review for AI Course Factory', () => {
    const limitation = STORE_FEATURE_PROOFS[PlatformFeature.COURSE_FACTORY]?.limitation ?? '';
    expect(limitation).toMatch(/credits/i);
    expect(limitation).toMatch(/human review/i);
  });
});
