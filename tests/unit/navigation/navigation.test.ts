import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '@/lib/navigation';

describe('public navigation discoverability', () => {
  it('preserves every established top-level destination', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'programs',
        'testing',
        'apprenticeships',
        'funding',
        'platform',
        'employers',
        'resources',
        'portals',
        'store',
        'foundation',
        'about',
      ]),
    );
  });

  it('keeps microcourses discoverable without replacing programs', () => {
    const programs = NAV_ITEMS.find((item) => item.id === 'programs');
    expect(programs?.subItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'All Programs', href: '/programs' }),
        expect.objectContaining({ name: 'All Microcourses', href: '/microclasses' }),
      ]),
    );
  });
  it('keeps exam services in Testing rather than Microcourses', () => {
    const programs = NAV_ITEMS.find((item) => item.id === 'programs');
    const testing = NAV_ITEMS.find((item) => item.id === 'testing');
    expect(testing?.href).toBe('/testing');
    expect(testing?.subItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Testing Center', href: '/testing' }),
      expect.objectContaining({ name: 'Book an Exam', href: '/testing/book' }),
      expect.objectContaining({ name: 'Certification Testing', href: '/testing/nha' }),
      expect.objectContaining({ name: 'Testing Products', href: '/store/testing' }),
    ]));
    expect(programs?.subItems?.some((item) => /^\/(testing|store\/testing)(\/|$)/.test(item.href ?? ''))).toBe(false);
  });
});
