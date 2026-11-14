import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import HostShopPlacementGuideClient from '@/components/programs/beauty/HostShopPlacementGuideClient';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';
vi.mock('@/components/partners/HostShopMediaCarousel', () => ({ default: () => null }));
afterEach(cleanup);
const shop = (slug: string, programs: string[]): HostShopNetworkEntry => ({
  id: slug,
  slug,
  name: slug,
  city: 'Indianapolis',
  state: 'IN',
  address: '123 Main St, Indianapolis, IN 46205',
  programs,
  description: 'Supervised apprenticeship training.',
  approval: 'approved',
});
it('keeps salon-only and unclassified listings out of barber results, including search', () => {
  render(
    <HostShopPlacementGuideClient
      programSlug="barber-apprenticeship"
      shops={[
        shop('Barber Studio', ['barber-apprenticeship']),
        shop('Beauty Academy', ['cosmetology-apprenticeship']),
        shop('Dual Studio', ['barber-apprenticeship', 'cosmetology-apprenticeship']),
        shop('Unknown Studio', []),
      ]}
    />,
  );
  expect(screen.getByRole('heading', { name: 'Barber Studio' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Dual Studio' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Beauty Academy' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Unknown Studio' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Beauty' } });
  expect(screen.queryByRole('link', { name: 'View Host Shop' })).not.toBeInTheDocument();
  expect(screen.getByText(/No matching Host Shop/)).toBeInTheDocument();
});
it('changes listings when the selected program changes', () => {
  const shops = [
    shop('Barber Studio', ['barber-apprenticeship']),
    shop('Beauty Academy', ['cosmetology-apprenticeship']),
  ];
  const { rerender } = render(
    <HostShopPlacementGuideClient programSlug="barber-apprenticeship" shops={shops} />,
  );
  rerender(<HostShopPlacementGuideClient programSlug="cosmetology-apprenticeship" shops={shops} />);
  expect(screen.getByRole('heading', { name: 'Beauty Academy' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Barber Studio' })).not.toBeInTheDocument();
});
