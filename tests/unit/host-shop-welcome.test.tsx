import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import HostShopWelcome from '@/components/host-shop/HostShopWelcome';

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
beforeEach(() => localStorage.clear());
afterEach(cleanup);
it('shows daily operations immediately for every selected shop', () => {
  const view = render(
    <HostShopWelcome partnerId="shop-a" shopName="Salon A">
      <h2>Daily operations</h2>
    </HostShopWelcome>,
  );
  expect(screen.getByText('Daily operations')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Open my dashboard →' })).toBeNull();
  view.rerender(
    <HostShopWelcome partnerId="shop-b" shopName="Salon B">
      <h2>Other shop operations</h2>
    </HostShopWelcome>,
  );
  expect(screen.getByText('Other shop operations')).toBeTruthy();
});
it('keeps daily operations usable when browser storage is unavailable', () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw Error('Storage unavailable');
  });
  render(
    <HostShopWelcome partnerId="shop-c" shopName="Salon C">
      <h2>Daily operations</h2>
    </HostShopWelcome>,
  );
  expect(screen.getByText('Daily operations')).toBeTruthy();
  spy.mockRestore();
});

it('uses the selected account photo instead of a shared salon hero', () => {
  const view = render(
    <HostShopWelcome
      partnerId="a"
      shopName="Salon A"
      ownerName="Owner A"
      profileImageUrl="/photos/owner-a.webp"
    >
      <div>Tools</div>
    </HostShopWelcome>,
  );
  expect(screen.getByRole('img', { name: 'Owner A profile photo' }).getAttribute('src')).toBe(
    '/photos/owner-a.webp',
  );
  expect(screen.getByRole('img', { name: 'Owner A profile photo' })).toBeTruthy();
  view.rerender(
    <HostShopWelcome
      partnerId="b"
      shopName="Salon B"
      ownerName="Owner B"
      profileImageUrl="/photos/owner-b.webp"
    >
      <div>Tools B</div>
    </HostShopWelcome>,
  );
  expect(screen.getByRole('img', { name: 'Owner B profile photo' }).getAttribute('src')).toBe(
    '/photos/owner-b.webp',
  );
  expect(screen.queryByRole('img', { name: 'Owner A profile photo' })).toBeNull();
});
it('uses that account initials when no profile photo exists', () => {
  render(
    <HostShopWelcome partnerId="no-photo" shopName="Styles" ownerName="Corienne Meid">
      <div>Tools</div>
    </HostShopWelcome>,
  );
  expect(screen.getByText('CM')).toBeTruthy();
  expect(screen.getByText('Corienne Meid')).toBeTruthy();
  expect(screen.queryByRole('img', { name: /Corienne Meid profile photo/i })).toBeNull();
});
