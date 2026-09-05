import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('host shop network architecture', () => {
  it('merges approved records with curated profiles without empty-network fallback', () => {
    const source = readFileSync('lib/programs/host-shop-network.ts', 'utf8');
    const page = readFileSync('apps/marketing/app/partners/host-shops/page.tsx', 'utf8');
    expect(source).toContain('getApprovedShops()');
    expect(source).toContain('matchedFeatured');
    expect(page).toContain('HostShopNetworkDirectory');
  });

  it('gives approved shops a profile before optional media exists', () => {
    const loader = readFileSync('lib/programs/host-shops.ts', 'utf8');
    const profile = readFileSync('apps/marketing/app/host-shops/[slug]/page.tsx', 'utf8');
    expect(loader).toContain('profile?.public_slug ?? publicSlug(shop.name, shop.id)');
    expect(profile).toContain('ApprovedHostShopProfile');
  });

  it('supports network media and a privacy-safe personalized email campaign', () => {
    const dashboard = readFileSync('apps/lms/app/host-shop/dashboard/HostShopDashboardView.tsx', 'utf8');
    const upload = readFileSync('apps/lms/app/api/host-shop/profile-media/route.ts', 'utf8');
    const campaign = readFileSync('lib/email/host-shop-network-launch.ts', 'utf8');
    expect(dashboard).toContain('Complete My Network Profile');
    expect(upload).toContain("kind !== 'video'");
    expect(campaign).toContain('pending-contact+');
    expect(campaign).toContain('Search visibility, inquiries, placements, and revenue are not guaranteed.');
    expect(campaign).not.toContain('bcc:');
  });
});
