import { describe, expect, it } from 'vitest';
import { ALL_PROGRAMS } from '@/data/programs/catalog';
import {
  PROGRAMS_PAGE_SUPPRESSED_SLUGS,
  resolvePublicProgramCount,
} from '@/lib/programs/public-programs-page';
import { mergeDbListingWithStaticCatalog } from '@/lib/programs/load-program-catalog';

describe('public programs SSR catalog', () => {
  it('static catalog has programs visible on /programs after suppress filter', () => {
    const visible = ALL_PROGRAMS.filter((p) => !PROGRAMS_PAGE_SUPPRESSED_SLUGS.has(p.slug));
    expect(visible.length).toBeGreaterThan(10);
  });

  it('emergency-health-safety and hvac-technician are not suppressed on /programs', () => {
    expect(PROGRAMS_PAGE_SUPPRESSED_SLUGS.has('emergency-health-safety')).toBe(false);
    expect(PROGRAMS_PAGE_SUPPRESSED_SLUGS.has('hvac-technician')).toBe(false);
    const visibleSlugs = new Set(
      ALL_PROGRAMS.filter((p) => !PROGRAMS_PAGE_SUPPRESSED_SLUGS.has(p.slug)).map((p) => p.slug),
    );
    expect(visibleSlugs.has('emergency-health-safety')).toBe(true);
    expect(visibleSlugs.has('hvac-technician')).toBe(true);
  });

  it('merges static programs missing from database listing', () => {
    const merged = mergeDbListingWithStaticCatalog(
      [{ slug: 'cna', title: 'CNA', description: null, category: 'Healthcare', sectionKey: 'healthcare', duration: '4 weeks', credential: 'CNA', funding_eligible: true }],
      PROGRAMS_PAGE_SUPPRESSED_SLUGS,
    );
    const slugs = new Set(merged.map((p) => p.slug));
    expect(slugs.has('cna')).toBe(true);
    expect(slugs.has('emergency-health-safety')).toBe(true);
    expect(slugs.has('hvac-technician')).toBe(true);
  });

  it('resolvePublicProgramCount uses SITE_STATS floor when count is zero', () => {
    expect(resolvePublicProgramCount(0)).toBeGreaterThan(0);
    expect(resolvePublicProgramCount(42)).toBe(42);
  });
});
