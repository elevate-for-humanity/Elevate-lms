import { describe, expect, it } from 'vitest';
import { mergeWebsiteImports } from '@/lib/websites/merge-imports';

describe('multi-source website import', () => {
  it('combines unique assets while keeping the first site as the brand source', () => {
    const merged = mergeWebsiteImports([
      {
        originalUrl: 'https://legacy83business.com',
        extracted: { title: 'Legacy 83', description: 'Primary', pageCount: 4, imagesFound: 10, productsFound: 0, colorsDetected: ['#111111'] },
        config: {
          branding: { logoText: 'Legacy 83' },
          navigation: [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }],
          homepage: { features: [{ title: 'Strategic Planning' }] },
          programs: [{ name: 'Leadership Coaching' }],
          contact: { email: 'info@example.com' },
        },
      },
      {
        originalUrl: 'https://second.example.com',
        extracted: { title: 'Second', description: 'Secondary', pageCount: 3, imagesFound: 7, productsFound: 1, colorsDetected: ['#111111', '#ffffff'] },
        config: {
          branding: { logoText: 'Wrong brand' },
          navigation: [{ label: 'About us', href: '/about' }, { label: 'Academy', href: '/academy' }],
          homepage: { features: [{ title: 'Strategic Planning' }, { title: 'Operational Excellence' }] },
          programs: [{ name: 'Leadership Coaching' }, { name: 'Legacy Transition' }],
          products: [{ name: 'Course', href: '/course' }],
          contact: { phone: '513-555-0100' },
        },
      },
    ]);

    expect(merged.config.branding.logoText).toBe('Legacy 83');
    expect(merged.config.navigation).toHaveLength(3);
    expect(merged.config.homepage.features).toHaveLength(2);
    expect(merged.config.programs).toHaveLength(2);
    expect(merged.config.contact).toEqual({ email: 'info@example.com', phone: '513-555-0100' });
    expect(merged.extracted).toMatchObject({ pageCount: 7, imagesFound: 17, productsFound: 1 });
    expect(merged.comparison).toHaveLength(2);
  });
});
