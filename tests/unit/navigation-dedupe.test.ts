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

  it('has no duplicate leaf hrefs across top-level sections', () => {
    const dupes = findDuplicateNavHrefs(NAV_ITEMS);
    if (dupes.length > 0) {
      console.log('Duplicate nav hrefs:', dupes);
    }
    expect(dupes).toEqual([]);
  });

  it('groups program subItems into category columns', () => {
    const programs = NAV_ITEMS.find((i) => i.id === 'programs');
    expect(programs?.subItems?.length).toBeGreaterThan(5);
    const columns = Object.values(groupNavSubItemsByHeader(programs!.subItems!));
    expect(columns.length).toBeGreaterThan(3);
    expect(columns.map(getNavCategoryLabel)).toContain('Healthcare');
  });

  it('includes core main menu sections', () => {
    const names = NAV_ITEMS.map((i) => i.name);
    expect(names).toContain('Programs');
    expect(names).toContain('Apprenticeships');
    expect(names).toContain('Funding');
    expect(names).toContain('Employers');
    expect(names).toContain('Resources');
    expect(names).toContain('Portals');
    expect(names).toContain('About');
  });

  it('includes support resources in the Resources dropdown', () => {
    const resources = NAV_ITEMS.find((i) => i.id === 'resources');
    const hrefs = (resources?.subItems ?? []).filter((s) => !s.isHeader).map((s) => s.href);
    expect(hrefs).toContain('/faq');
  });
});
