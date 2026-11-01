import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PublicPathwayLinks from '@/components/marketing/PublicPathwayLinks';

const route = vi.hoisted(() => ({ path: '/programs/hvac-technician' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.path }));
afterEach(cleanup);

describe('shared public next-step navigation', () => {
  it('keeps student destinations without repeating decorative photos on program pages', () => {
    route.path = '/programs/hvac-technician';
    const { container } = render(<PublicPathwayLinks />);
    expect(screen.getByRole('link', { name: /Find your career program/ }).getAttribute('href')).toBe('/programs');
    expect(screen.getByRole('link', { name: /Understand how to pay/ }).getAttribute('href')).toBe('/check-eligibility');
    expect(screen.getByRole('link', { name: /Start your application/ }).getAttribute('href')).toBe('/apply/student');
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
  it('preserves employer and host-shop entry points without a repeated photo grid', () => {
    route.path = '/employers';
    const { container } = render(<PublicPathwayLinks />);
    expect(screen.getByRole('link', { name: /Become a Host Shop/ }).getAttribute('href')).toBe('/partners/host-shops');
    expect(screen.getByRole('link', { name: /Start a partnership/ }).getAttribute('href')).toBe('/partners/apply');
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });
  it('does not add navigation to checkout or operational screens', () => {
    for (const path of ['/testing/checkout', '/lms/dashboard', '/admin']) {
      route.path = path;
      const { container, unmount } = render(<PublicPathwayLinks />);
      expect(container.children).toHaveLength(0);
      unmount();
    }
  });
});
