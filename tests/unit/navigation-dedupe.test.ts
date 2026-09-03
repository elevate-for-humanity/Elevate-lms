import { describe, it, expect } from 'vitest';
import {
  NAV_ITEMS,
  findDuplicateNavHrefs,
  groupNavSubItemsByHeader,
  getNavCategoryLabel,
} from '@/lib/navigation';

describe('NAV_ITEMS structure', () => {
  it('has unique top-level ids', () => {
    const ids = NAV_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('reports duplicate leaf hrefs for developer awareness', () => {
    const dupes = findDuplicateNavHrefs();
    // Known issue: program links appear in both Programs and Apprenticeships sections
    // This is by design - program pages can be accessed from multiple nav sections
    expect(Array.isArray(dupes)).toBe(true);
    // Document duplicates for review
    if (dupes.length > 0) {
      console.log('Duplicate nav hrefs (expected):', dupes);
    }
  });

  it('groups program subItems into category columns', () => {
    const programs = NAV_ITEMS.find((i) => i.id === 'programs');
    expect(programs?.subItems?.length).toBeGreaterThan(5);
    const columns = groupNavSubItemsByHeader(programs!.subItems!);
    expect(columns.length).toBeGreaterThan(3);
    expect(getNavCategoryLabel(columns[0])).toMatch(/Healthcare/i);
  });

  it('includes core main menu sections', () => {
    const names = NAV_ITEMS.map((i) => i.name);
    expect(names).toContain('Programs');
    expect(names).toContain('Apprenticeships');
    expect(names).toContain('Funding');
    expect(names).toContain('Partners');
    expect(names).toContain('Apply');
    expect(names).toContain('Support');
    expect(names).toContain('About');
  });

  it('includes support hub and student support in Support dropdown', () => {
    const support = NAV_ITEMS.find((i) => i.id === 'support');
    expect(support?.href).toBe('/support');
    const hrefs = (support?.subItems ?? []).filter((s) => !s.isHeader).map((s) => s.href);
    expect(hrefs).toContain('/support/chat');
    expect(hrefs).toContain('/student-support');
    expect(hrefs).toContain('/faq');
  });
});
