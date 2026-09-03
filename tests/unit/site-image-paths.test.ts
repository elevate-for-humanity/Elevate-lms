import { describe, expect, it } from 'vitest';
import { resolveSiteImagePath } from '@/lib/images/site-image-paths';

describe('resolveSiteImagePath', () => {
  it('maps known broken webp paths to existing files', () => {
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/business/office-admin.webp')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/business/office-admin.webp',
    );
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/accessibility-hero.jpg')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/accessibility-hero.jpg',
    );
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/beauty/esthetician.webp')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/beauty/esthetician.webp',
    );
  });

  it('maps legacy .jpg paths to .webp from conversion manifest', () => {
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/pathways-page-6.webp')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/pathways-page-6.webp',
    );
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/how-it-works-hero.webp')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/how-it-works-hero.webp',
    );
  });

  it('returns unknown paths unchanged', () => {
    expect(resolveSiteImagePath('https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp')).toBe(
      'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/hvac-technician.webp',
    );
  });

  it('returns fallback for null/empty src', () => {
    expect(resolveSiteImagePath(null)).toBe('/images/heroes/hero-homepage.webp');
    expect(resolveSiteImagePath('')).toBe('/images/heroes/hero-homepage.webp');
  });
});
