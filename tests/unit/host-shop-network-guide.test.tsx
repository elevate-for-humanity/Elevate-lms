import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('next/image', () => ({ default: ({ fill, sizes, ...props }: any) => <img {...props} /> }));
import { BarberBeautyNetworkGuide } from '@/components/partners/BarberBeautyNetworkGuide';
afterEach(cleanup);
it('provides three real pictures and useful calls to action', () => {
  render(<BarberBeautyNetworkGuide />);
  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getByRole('link', { name: 'Add a photo or video →' })).toHaveAttribute(
    'href',
    '#community-post-composer',
  );
  expect(screen.getByRole('link', { name: 'Find the network group →' })).toHaveAttribute(
    'href',
    '#community-tools',
  );
  expect(screen.getByRole('link', { name: 'Meet members →' })).toHaveAttribute(
    'href',
    '/lms/members',
  );
  expect(screen.getByText(/portfolio post does not replace/)).toBeInTheDocument();
});
