import { describe, expect, it } from 'vitest';
import { importStructuredWebsiteData } from '@/lib/websites/import-data-service';

describe('Website Builder structured import', () => {
  it('imports an existing JSON website configuration as a reviewable draft', () => {
    const imported = importStructuredWebsiteData({
      fileName: 'legacy-83.json',
      content: JSON.stringify({
        siteName: 'Legacy 83 Business',
        branding: { logoText: 'Legacy 83 Business', primaryColor: '#172554' },
        homepage: { heroTitle: 'Build a lasting legacy', features: [] },
        programs: [{ name: 'Strategic Planning', description: 'Planning services.' }],
      }),
    });

    expect(imported.format).toBe('json');
    expect(imported.siteName).toBe('Legacy 83 Business');
    expect(imported.config.homepage.heroTitle).toBe('Build a lasting legacy');
    expect(imported.config.programs[0]?.name).toBe('Strategic Planning');
    expect(imported.config.meta).toMatchObject({
      importedFrom: 'file',
      importedFormat: 'json',
      requiresContentReview: true,
    });
  });

  it('maps CSV services, products, contact details and navigation', () => {
    const imported = importStructuredWebsiteData({
      fileName: 'legacy-83.csv',
      content: [
        'type,name,description,price,href,email,phone',
        'site,Legacy 83 Business,Leadership and operations,,,,',
        'service,Leadership Coaching,Executive coaching,,,,',
        'product,Strategy Session,One-on-one session,250,https://example.com/book,,',
        'navigation,Book Now,,,/contact,,',
        'contact,,,,,hello@example.com,513-555-0100',
      ].join('\n'),
    });

    expect(imported.format).toBe('csv');
    expect(imported.recordCount).toBe(5);
    expect(imported.config.programs).toContainEqual(expect.objectContaining({ name: 'Leadership Coaching' }));
    expect(imported.config.products).toContainEqual(expect.objectContaining({ name: 'Strategy Session', price: '250' }));
    expect(imported.config.contact).toMatchObject({ email: 'hello@example.com', phone: '513-555-0100' });
    expect(imported.config.navigation).toContainEqual({ label: 'Book Now', href: '/contact' });
  });

  it('rejects empty, malformed and oversized imports', () => {
    expect(() => importStructuredWebsiteData({ content: '', fileName: 'empty.json' })).toThrow('empty');
    expect(() => importStructuredWebsiteData({ content: '{broken', fileName: 'broken.json' })).toThrow('valid JSON');
    expect(() => importStructuredWebsiteData({ content: 'x'.repeat(2_000_001), fileName: 'large.json' })).toThrow('2 MB');
  });
});
