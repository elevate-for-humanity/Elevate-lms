import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shop-network', () => ({
  getHostShopNetwork: async () => [
    { id: 'salon', slug: 'salon', name: 'Salon only', city: 'Indy', state: 'IN', address: '1 Main St', programs: ['cosmetology-apprenticeship'], primaryProgram: 'cosmetology-apprenticeship', gallery: [{ url: '/salon.webp' }] },
    { id: 'barber', slug: 'kountry-kutz-barbershop', name: 'Barber Studio', city: 'Indy', state: 'IN', address: '2 Main St', programs: ['barber-apprenticeship'], primaryProgram: 'barber-apprenticeship', gallery: [{ url: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp' }, { url: '/manicure.webp' }], videoUrl: '/videos/partners/kountry-kutz-tour.mp4' },
  ],
}));
vi.mock('@/components/partners/HostShopMediaCarousel', () => ({
  default: ({ items, videoUrl }: { items: { url: string }[]; videoUrl?: string }) => <div>{items.map(item => <img key={item.url} src={item.url} alt={item.url} />)}{videoUrl && <video aria-label="Shop tour" src={videoUrl} />}</div>,
}));
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import HostShopPlacementGuide from '@/components/programs/beauty/HostShopPlacementGuide';
afterEach(cleanup);

for (const [name, Component] of [['featured cards', FeaturedHostPartners], ['placement guide', HostShopPlacementGuide]] as const) {
  it(`${name} keep salons and manicures off the barber page and retain shop videos`, async () => {
    render(await Component({ programSlug: 'barber-apprenticeship' }));
    expect(screen.queryByText('Salon only')).not.toBeInTheDocument();
    expect(screen.getByAltText('/images/partners/kountry-kutz/interior-active-enhanced-2026.webp')).toBeInTheDocument();
    expect(screen.queryByAltText('/manicure.webp')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Shop tour')).toHaveAttribute('src', '/videos/partners/kountry-kutz-tour.mp4');
  });
}

it('keeps dual-approved barber-primary shops available for approved cosmetology placements but out of the cosmetology marketing gallery', async () => {
  const { getHostShopNetwork } = await import('@/lib/programs/host-shop-network');
  const shops = await getHostShopNetwork();
  const barber = shops.find(shop => shop.id === 'barber')!;
  barber.programs.push('cosmetology-apprenticeship');
  // Program approval permits placement matching for BOTH explicitly approved trades.
  // Public category presentation follows the primary trade and remains separate.
  const { matchesHostShopProgram, matchesHostShopPresentationProgram } = await import('@/lib/programs/host-shop-programs');
  expect(matchesHostShopProgram(barber, 'cosmetology-apprenticeship')).toBe(true);
  expect(matchesHostShopPresentationProgram(barber, 'cosmetology-apprenticeship')).toBe(false);
  const { default: Guide } = await import('@/components/programs/beauty/HostShopPlacementGuideClient');
  render(<Guide programSlug="cosmetology-apprenticeship" shops={[{ ...barber, description: 'Dual approved business', approval: 'approved' }]} />);
  expect(screen.getByRole('heading', { name: 'Barber Studio' })).toBeInTheDocument();
});
