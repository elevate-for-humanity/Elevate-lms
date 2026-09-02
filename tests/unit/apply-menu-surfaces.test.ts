import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, findDuplicateNavHrefs } from '@/lib/navigation';
import {
  APPLY_AUDIT_SURFACES,
  EXTRA_HOST_APPLY_LINKS,
  PROGRAM_APPLY_LINKS,
} from '@/lib/apply/apply-surface-routes';

describe('Apply menu surfaces', () => {
  it('does not restore a retired top-level apply navigation item', () => {
    expect(NAV_ITEMS.some((item) => item.id === 'apply')).toBe(false);
  });

  it('keeps dedicated program apply routes in the canonical audit surface list', () => {
    const auditHrefs = new Set(APPLY_AUDIT_SURFACES.map((surface) => surface.href.split('?')[0]));
    for (const program of PROGRAM_APPLY_LINKS) {
      expect(auditHrefs.has(program.href.split('?')[0])).toBe(true);
    }
  });

  it('keeps esthetician and nail host apply links in the canonical audit surface list', () => {
    const auditHrefs = new Set(APPLY_AUDIT_SURFACES.map((surface) => surface.href.split('?')[0]));
    for (const link of EXTRA_HOST_APPLY_LINKS) {
      expect(auditHrefs.has(link.href.split('?')[0])).toBe(true);
    }
  });

  it('reports duplicate hrefs for developer awareness', () => {
    const dupes = findDuplicateNavHrefs(NAV_ITEMS);
    expect(Array.isArray(dupes)).toBe(true);
  });

  it('documents the two canonical extra host apply links', () => {
    expect(EXTRA_HOST_APPLY_LINKS).toHaveLength(2);
  });

  it('owns Host Site discovery under Apprenticeships instead of Employers', () => {
    const apprenticeships = NAV_ITEMS.find((item) => item.id === 'apprenticeships');
    const employers = NAV_ITEMS.find((item) => item.id === 'employers');

    expect(apprenticeships?.subItems?.some((item) => item.name === 'All Host Sites')).toBe(true);
    expect(apprenticeships?.subItems?.some((item) => item.name === 'Become a Host Site')).toBe(true);
    expect(employers?.subItems?.some((item) => /Host Site/.test(item.name))).toBe(false);
  });
});
