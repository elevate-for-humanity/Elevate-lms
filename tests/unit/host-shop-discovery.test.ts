import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('host shop search discovery', () => {
  it('only exposes currently approved Host Shop profiles in the public sitemap', () => {
    const sitemap = readFileSync('apps/marketing/app/sitemap.ts', 'utf8');
    expect(sitemap).toContain('await getApprovedShops()');
    expect(sitemap).not.toContain('...featuredHostShopRoutes');
    expect(sitemap).toContain('.filter((shop) => Boolean(shop.publicSlug))');
    expect(sitemap).toContain('/host-shops/${shop.publicSlug}');
  });

  it('publishes business identity and local discovery structured data', () => {
    const profile = readFileSync('apps/marketing/app/host-shops/[slug]/page.tsx', 'utf8');
    expect(profile).toContain("'@type': 'BreadcrumbList'");
    expect(profile).toContain("'@id': `${canonical}#business`");
    expect(profile).toContain('addressLocality: shop.city');
    expect(profile).toContain('potentialAction: shop.bookingUrl');
  });
});
