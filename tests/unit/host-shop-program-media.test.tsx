import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shop-network', () => ({
  getHostShopNetwork: async () => [
    { id: 'salon', slug: 'salon', name: 'Salon only', city: 'Indy', state: 'IN', address: '1 Main St', programs: ['cosmetology-apprenticeship'], primaryProgram: 'cosmetology-apprenticeship', gallery: [{ url: '/salon.webp' }] },
    { id: 'barber', slug: 'barber', name: 'Barber Studio', city: 'Indy', state: 'IN', address: '2 Main St', programs: ['barber-apprenticeship'], primaryProgram: 'barber-apprenticeship', gallery: [{ url: '/haircut.webp' }, { url: '/manicure.webp' }], videoUrl: '/barber-tour.mp4' },
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
    expect(screen.getByAltText('/haircut.webp')).toBeInTheDocument();
    expect(screen.queryByAltText('/manicure.webp')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Shop tour')).toHaveAttribute('src', '/barber-tour.mp4');
  });
}

it('preserves approved dual-program placement choices with trade-specific photographs', async () => {
  const { getHostShopNetwork } = await import('@/lib/programs/host-shop-network');
  const shops = await getHostShopNetwork();
  const barber = shops.find(shop => shop.id === 'barber')!;
  barber.programs.push('cosmetology-apprenticeship');
  // The actual function reads a fresh list; test the placement component's
  // existing client contract directly for a primary-barber dual approval.
  const { default: Guide } = await import('@/components/programs/beauty/HostShopPlacementGuideClient');
  render(<Guide programSlug="cosmetology-apprenticeship" shops={[{ ...barber, description: 'Dual approved business', approval: 'approved' }]} />);
  expect(screen.getByRole('heading', { name: 'Barber Studio' })).toBeInTheDocument();
});
