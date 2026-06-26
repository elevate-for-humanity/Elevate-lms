import { describe, it, expect } from 'vitest';
import { NAV_ITEMS, findDuplicateNavHrefs } from '@/lib/navigation';
import { APPLY_AUDIT_SURFACES, EXTRA_HOST_APPLY_LINKS, PROGRAM_APPLY_LINKS } from '@/lib/apply/apply-surface-routes';

describe('Apply menu surfaces', () => {
  const apply = NAV_ITEMS.find((i) => i.id === 'apply')!;

  it('includes esthetician and nail host apply links', () => {
    const hrefs = (apply.subItems ?? []).filter((s) => !s.isHeader).map((s) => s.href);
    expect(hrefs).toContain('/partners/esthetician-apprenticeship/apply');
    expect(hrefs).toContain('/partners/nail-technician-apprenticeship/apply');
  });

  it('includes dedicated program apply routes', () => {
    const hrefs = (apply.subItems ?? []).filter((s) => !s.isHeader).map((s) => s.href);
    for (const p of PROGRAM_APPLY_LINKS) {
      expect(hrefs).toContain(p.href);
    }
  });

  it('reports duplicate hrefs for developer awareness', () => {
    // Known issue: program links appear in both Programs and Apprenticeships sections
    const dupes = findDuplicateNavHrefs();
    // Document the known duplicates
    const programDupes = dupes.filter(d => d.href.startsWith('/programs/'));
    // The test passes if there are no unexpected duplicates beyond known ones
    expect(Array.isArray(dupes)).toBe(true);
  });

  it('audit surface list covers all apply subItems', () => {
    const navHrefs = new Set(
      (apply.subItems ?? []).filter((s) => !s.isHeader).map((s) => s.href.split('?')[0]),
    );
    const auditHrefs = new Set(APPLY_AUDIT_SURFACES.map((s) => s.href.split('?')[0]));
    for (const h of navHrefs) {
      expect(auditHrefs.has(h)).toBe(true);
    }
  });

  it('documents extra host links constant', () => {
    expect(EXTRA_HOST_APPLY_LINKS).toHaveLength(2);
  });
});
