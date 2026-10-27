import { describe, expect, it } from 'vitest';
import {
  EMPLOYER_NETWORK_REGIONS,
  EMPLOYER_TALENT_PATHWAYS,
  getEmployerTalentPathway,
} from '@/lib/marketing/employer-talent-network';

describe('employer talent network architecture', () => {
  it('publishes each requested employer pathway', () => {
    expect(EMPLOYER_TALENT_PATHWAYS.map((item) => item.slug)).toEqual([
      'cdl',
      'bookkeeping',
      'business-administration',
      'web-development',
      'it-help-desk',
    ]);
  });

  it('provides complete employer and regional routing data', () => {
    expect(EMPLOYER_NETWORK_REGIONS).toHaveLength(4);
    for (const pathway of EMPLOYER_TALENT_PATHWAYS) {
      expect(getEmployerTalentPathway(pathway.slug)).toBe(pathway);
      expect(pathway.programSlug).toBeTruthy();
      expect(pathway.training.length).toBeGreaterThanOrEqual(3);
      expect(pathway.roles.length).toBeGreaterThanOrEqual(3);
      expect(pathway.industry).toBeTruthy();
    }
  });
});
