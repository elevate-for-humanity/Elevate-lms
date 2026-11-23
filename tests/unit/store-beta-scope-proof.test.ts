import { describe, expect, it } from 'vitest';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import { STORE_FEATURE_PROOFS } from '@/lib/store/offer-proof';

describe('public Store repair/beta capability evidence', () => {
  for (const capability of CAPABILITY_CATALOG.filter((item) => item.status === 'repair')) {
    it(`${capability.key} discloses a concrete access or delivery limitation`, () => {
      const proof = STORE_FEATURE_PROOFS[capability.key];
      expect(proof).toBeDefined();
      expect(proof?.limitation?.trim().length ?? 0).toBeGreaterThan(25);
    });
  }

  it('does not present the staff-only Course Builder as instant self-service', () => {
    expect(STORE_FEATURE_PROOFS.course_builder?.limitation).toMatch(/staff|self-service/i);
    expect(STORE_FEATURE_PROOFS.course_factory?.limitation).toMatch(/approval|review/i);
  });
});
