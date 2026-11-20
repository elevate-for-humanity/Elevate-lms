import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import AdminNav from '@/components/admin/AdminNav';
import { AdminMobileDock } from '@/components/admin/AdminMobileDock';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock('@/components/site/LogoImage', () => ({ default: () => null }));
vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

afterEach(cleanup);

it('opens the left Studio sidebar with the standalone app installer', async () => {
  render(<AdminNav />);
  expect(screen.queryByRole('link', { name: 'Admin AI' })).toBeNull();
  expect(screen.queryByRole('link', { name: 'Install Dev Studio' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Open Studio sidebar' }));
  const sidebar = await screen.findByRole('dialog', { name: 'Dev Studio' });
  expect(sidebar).toHaveClass('left-0');
  expect(within(sidebar).getByRole('link', { name: 'Install Dev Studio' })).toHaveAttribute(
    'href',
    '/install/dev-studio.html',
  );
  fireEvent.click(within(sidebar).getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog', { name: 'Dev Studio' })).toBeNull();
});

it('keeps the mobile dock focused on Admin routes', () => {
  render(<AdminMobileDock />);
  const dock = screen.getByRole('navigation', { name: 'Mobile admin navigation' });
  expect(within(dock).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/dashboard');
  expect(within(dock).queryByRole('link', { name: 'Studio' })).toBeNull();
});
