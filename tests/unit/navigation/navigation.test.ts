import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '@/lib/navigation';

describe('public navigation discoverability', () => {
  it('preserves every established top-level destination', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'programs',
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
        expect.objectContaining({
          name: 'Certification Testing',
          href: '/certification-testing',
        }),
      ]),
    );
  });
});
