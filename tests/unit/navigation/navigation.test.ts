import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '@/lib/navigation';

describe('public navigation discoverability', () => {
  it('keeps a compact menu and makes founder and staff discoverable', () => {
    expect(NAV_ITEMS.length).toBeLessThanOrEqual(8);
    const about = NAV_ITEMS.find(item => item.id === 'about');
    expect(about?.subItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ href: '/about/team' }),
      expect.objectContaining({ href: '/about/elizabeth-greene' }),
    ]));
    const resources = NAV_ITEMS.find(item => item.id === 'resources');
    expect(resources?.subItems?.some(item => item.href === '/online-apps')).toBe(true);
    const partners = NAV_ITEMS.find(item => item.id === 'employers');
    expect(partners?.subItems?.some(item => item.href === '/platform')).toBe(true);
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
    expect(testing?.subItems).toBeUndefined();
    expect(programs?.subItems?.some((item) => /^\/(testing|store\/testing)(\/|$)/.test(item.href ?? ''))).toBe(false);
  });
});
