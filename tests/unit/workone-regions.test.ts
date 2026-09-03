import { describe, expect, it } from 'vitest';
import {
  WORKONE_REGIONS,
  getWorkOneRegion,
  workOneMapEmbedUrl,
} from '@/data/workone/indiana-regions';

describe('workone indiana regions', () => {
  it('includes central indiana with multiple centers', () => {
    const central = getWorkOneRegion('central-indiana');
    expect(central).toBeDefined();
    expect(central!.centers.length).toBeGreaterThanOrEqual(3);
  });

  it('generates valid map embed URLs', () => {
    for (const region of WORKONE_REGIONS) {
      const url = workOneMapEmbedUrl(region);
      expect(url).toContain('maps.google.com');
      expect(url).toContain('output=embed');
    }
  });
});
