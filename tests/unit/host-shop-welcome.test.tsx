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
it('introduces a new shop before showing daily operations and remembers entry for that shop', () => {
  const view = render(
    <HostShopWelcome partnerId="shop-a" shopName="Salon A">
      <h2>Daily operations</h2>
    </HostShopWelcome>,
  );
  expect(screen.queryByText('Daily operations')).toBeNull();
  expect(screen.getByRole('link', { name: 'Start visual orientation' }).getAttribute('href')).toBe(
    '/host-shop/orientation',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open my dashboard →' }));
  expect(screen.getByText('Daily operations')).toBeTruthy();
  view.rerender(
    <HostShopWelcome partnerId="shop-b" shopName="Salon B">
      <h2>Other shop operations</h2>
    </HostShopWelcome>,
  );
  expect(screen.queryByText('Other shop operations')).toBeNull();
  expect(screen.getByText('Welcome, Salon B')).toBeTruthy();
});
it('keeps entry usable when browser storage is unavailable', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw Error('Storage unavailable');
  });
  render(
    <HostShopWelcome partnerId="shop-c" shopName="Salon C">
      <h2>Daily operations</h2>
    </HostShopWelcome>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open my dashboard →' }));
  expect(screen.getByText('Daily operations')).toBeTruthy();
  spy.mockRestore();
});
