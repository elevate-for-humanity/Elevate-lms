import { describe, expect, it } from 'vitest';
import { INDIANAPOLIS_PROGRAM_HUBS } from '@/data/seo/indianapolis-program-hubs';

describe('Indianapolis program+city SEO hubs', () => {
  it('has unique slugs and canonical paths', () => {
    const slugs = INDIANAPOLIS_PROGRAM_HUBS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const hub of INDIANAPOLIS_PROGRAM_HUBS) {
      expect(hub.slug).toMatch(/-indianapolis$/);
      expect(hub.metadata.title.length).toBeGreaterThan(10);
      expect(hub.faqs.length).toBeGreaterThanOrEqual(2);
    }
  });
});
