import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const dependencies = vi.hoisted(() => ({ load: vi.fn(), error: vi.fn() }));
vi.mock('@/lib/programs/host-shop-network', () => ({ getHostShopNetwork: dependencies.load }));
vi.mock('@/lib/logger', () => ({ logger: { error: dependencies.error } }));
vi.mock('@/components/partners/HostShopNetworkDirectory', () => ({ default: () => <div>Approved directory loaded</div> }));
vi.mock('@/components/partners/HostShopMediaCarousel', () => ({ default: () => null }));
vi.mock('@/components/partners/HostShopBenefits', () => ({ default: () => null }));
vi.mock('@/components/hero/SafeHeroVideo', () => ({ SafeHeroVideo: () => null }));

import NetworkPage from '@/apps/marketing/app/barber-beauty-network/page';

describe('public Host Shop network failure state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps the page usable and reports directory unavailability without pretending records loaded', async () => {
    dependencies.load.mockRejectedValueOnce(new Error('directory unavailable'));
    const html = renderToStaticMarkup(await NetworkPage());
    expect(html).toContain('Barber &amp; Beauty Network');
    expect(html).toContain('role="alert"');
    expect(html).toContain('The shop directory is temporarily unavailable.');
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain('Approved directory loaded');
    expect(dependencies.error).toHaveBeenCalledOnce();
  });

  it('keeps successful directory rendering and omits the failure message', async () => {
    dependencies.load.mockResolvedValueOnce([]);
    const html = renderToStaticMarkup(await NetworkPage());
    expect(html).toContain('Approved directory loaded');
    expect(html).not.toContain('role="alert"');
    expect(dependencies.error).not.toHaveBeenCalled();
  });
});
