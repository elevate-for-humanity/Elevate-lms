import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('@/lib/programs/host-shop-network', () => ({
  getHostShopNetwork: async () => [
    { id: 'salon', slug: 'salon', name: 'Salon only', city: 'Indy', state: 'IN', address: '1 Main St', programs: ['cosmetology-apprenticeship', 'barber-apprenticeship'], primaryProgram: 'cosmetology-apprenticeship', gallery: [{ url: '/salon.webp' }] },
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
