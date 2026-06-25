import { describe, expect, it } from 'vitest';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

describe('resolveSiteImagePath', () => {
  it('maps known broken webp paths to existing files', () => {
    expect(resolveSiteImagePath('/images/business/office-admin.webp')).toBe(
      '/images/business/office-admin.webp',
    );
    expect(resolveSiteImagePath('/images/pages/accessibility-hero.jpg')).toBe(
      '/images/pages/accessibility-hero.jpg',
    );
    expect(resolveSiteImagePath('/images/beauty/esthetician.webp')).toBe(
      '/images/beauty/esthetician.webp',
    );
  });

  it('maps legacy .jpg paths to .webp from conversion manifest', () => {
    expect(resolveSiteImagePath('/images/pages/pathways-page-6.webp')).toBe(
      '/images/pages/pathways-page-6.webp',
    );
    expect(resolveSiteImagePath('/images/pages/how-it-works-hero.webp')).toBe(
      '/images/pages/how-it-works-hero.webp',
    );
  });

  it('returns unknown paths unchanged', () => {
    expect(resolveSiteImagePath('/images/pages/hvac-technician.webp')).toBe(
      '/images/pages/hvac-technician.webp',
    );
  });

  it('returns fallback for null/empty src', () => {
    expect(resolveSiteImagePath(null)).toBe('/images/pages/prog-hero-main-2.webp');
    expect(resolveSiteImagePath('')).toBe('/images/pages/prog-hero-main-2.webp');
  });
});
