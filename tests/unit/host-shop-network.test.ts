import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('host shop network architecture', () => {
  it('merges approved records with curated profiles without empty-network fallback', () => {
    const source = readFileSync('lib/programs/host-shop-network.ts', 'utf8');
    const page = readFileSync('apps/marketing/app/partners/host-shops/page.tsx', 'utf8');
    expect(source).toContain('getApprovedShops()');
    expect(source).toContain('uniqueHostShops(operational)');
    expect(page).toContain('BEAUTY_TRADES.map');
    expect(page).toContain('matchesHostShopPresentationProgram');
  });

  it('gives approved shops a profile before optional media exists', () => {
    const loader = readFileSync('lib/programs/host-shops.ts', 'utf8');
    const profile = readFileSync('apps/marketing/app/host-shops/[slug]/page.tsx', 'utf8');
    expect(loader).toContain('publicSlug: profileSlug || applicationSlug');
    expect(profile).toContain('ApprovedHostShopProfile');
  });

  it('keeps the Host Shop hub concise and routes photography into approved trade-specific pages', () => {
    const home = readFileSync('apps/marketing/app/page.tsx', 'utf8');
    const hub = readFileSync('apps/marketing/app/partners/host-shops/page.tsx', 'utf8');
    const directory = readFileSync('apps/marketing/app/partners/host-shops/[trade]/page.tsx', 'utf8');
    expect(home).not.toContain('<HostShopShowcase');
    expect(hub).not.toContain('<HostShopShowcase');
    expect(hub).not.toContain('<HostShopNetworkDirectory');
    expect(hub).toContain('BEAUTY_TRADES.map');
    expect(directory).toContain('<HostShopNetworkDirectory shops={shops} programSlug={trade.programSlug} />');
    expect(directory).toContain('matchesHostShopPresentationProgram');
  });

  it('moves the narrated program showcase from the homepage to the All Programs hero', () => {
    const home = readFileSync('apps/marketing/app/page.tsx', 'utf8');
    const programs = readFileSync('apps/marketing/app/programs/page.tsx', 'utf8');
    expect(home).not.toContain('<HomeProgramShowcase');
    expect(programs).toContain('<HomeProgramShowcase asHero />');
    expect(programs).toContain('data-narration-src="/audio/heroes/home.mp3"');
  });

  it('keeps the More menu compact by avoiding globally padded section wrappers', () => {
    const desktopNav = readFileSync('components/site/HeaderDesktopNav.tsx', 'utf8');
    expect(desktopNav).not.toContain('<section key={item.id ?? item.name}');
    expect(desktopNav).toContain('<div key={key} className="relative shrink-0"');
    expect(desktopNav).toContain('aria-controls={panelId}');
  });

  it('supports network media and a privacy-safe personalized email campaign', () => {
    const dashboard = readFileSync(
      'apps/lms/app/host-shop/dashboard/HostShopDashboardView.tsx',
      'utf8',
    );
    const upload = readFileSync('apps/lms/app/api/host-shop/profile-media/route.ts', 'utf8');
    const campaign = readFileSync('lib/email/host-shop-network-launch.ts', 'utf8');
    const navigation = readFileSync('lib/navigation/navigation-config.ts', 'utf8');
    expect(dashboard).toContain('<HostShopWelcome');
    expect(navigation).toContain("label: 'Shop Profile'");
    expect(upload).toContain("kind !== 'video'");
    expect(campaign).toContain('pending-contact+');
    expect(campaign).toContain(
      'Search visibility, inquiries, placements, and revenue are not guaranteed.',
    );
    expect(campaign).not.toContain('bcc:');
  });
});
