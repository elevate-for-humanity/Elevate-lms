import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('host shop search discovery', () => {
  it('includes curated Host Shop profiles in the public sitemap', () => {
    const sitemap = readFileSync('apps/marketing/app/sitemap.ts', 'utf8');
    expect(sitemap).toContain('FEATURED_BEAUTY_HOST_PARTNERS.map');
    expect(sitemap).toContain('/host-shops/${shop.slug}');
  });

  it('publishes business identity and local discovery structured data', () => {
    const profile = readFileSync('apps/marketing/app/host-shops/[slug]/page.tsx', 'utf8');
    expect(profile).toContain("'@type': 'BreadcrumbList'");
    expect(profile).toContain("'@id': `${canonical}#business`");
    expect(profile).toContain('addressLocality: shop.city');
    expect(profile).toContain('potentialAction: shop.bookingUrl');
  });
});
