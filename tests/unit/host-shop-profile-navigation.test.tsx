import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HostShopNetworkDirectory from '@/components/partners/HostShopNetworkDirectory';
import HostShopPlacementGuideClient from '@/components/programs/beauty/HostShopPlacementGuideClient';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';

vi.mock('next/image', () => ({
  default: ({
    fill,
    sizes,
    unoptimized,
    ...props
  }: {
    fill?: boolean;
    sizes?: string;
    unoptimized?: boolean;
  }) => <img {...props} />,
}));
afterEach(cleanup);
const shop: HostShopNetworkEntry = {
  id: 'test-shop',
  slug: 'actual-shop',
  name: 'Actual Shop',
  city: 'Indianapolis',
  state: 'IN',
  address: '123 Main St',
  programs: ['barber-apprenticeship'],
  description: 'Shop portfolio',
  image: '/shop.webp',
  booking: 'https://example.com/book',
  phone: '(317) 555-0100',
  approval: 'approved',
};

describe('actual shop navigation', () => {
  it('links the shop name and profile button to the same shop beside its slideshow', () => {
    render(<HostShopNetworkDirectory shops={[shop]} />);
    for (const name of ['Actual Shop', 'View shop profile']) {
      expect(screen.getByRole('link', { name, exact: true })).toHaveAttribute(
        'href',
        '/host-shops/actual-shop',
      );
    }
    expect(screen.getByRole('link', { name: 'Book a service ↗' })).toHaveAttribute(
      'href',
      shop.booking,
    );
    expect(screen.getByRole('link', { name: 'Call the shop' })).toHaveAttribute(
      'href',
      'tel:3175550100',
    );
  });
  it('links the program placement name and profile button to the actual shop', () => {
    render(<HostShopPlacementGuideClient shops={[shop]} programSlug="barber-apprenticeship" />);
    expect(screen.getByRole('link', { name: 'View Host Shop', exact: true })).toHaveAttribute(
      'href',
      '/host-shops/actual-shop',
    );
    expect(screen.getByRole('link', { name: 'Actual Shop', exact: true })).toHaveAttribute(
      'href',
      '/host-shops/actual-shop',
    );
  });
});
