import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import VisualDashboardOrientation from '@/components/orientation/VisualDashboardOrientation';

vi.mock('next/image', () => ({ default: ({ src, alt }: any) => <img src={src} alt={alt} /> }));
vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
afterEach(cleanup);

it('opens a narrated learner guide and removes playback when switching to pictures', () => {
  const { container } = render(<VisualDashboardOrientation audience="learner" compact />);
  fireEvent.click(screen.getByRole('button', { name: 'Watch narrated video' }));
  expect(container.querySelector('video')?.hasAttribute('playsinline')).toBe(true);
  expect(container.querySelector('source')?.getAttribute('src')).toBe(
    '/api/orientation/media/learner?format=mp4',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Explore slides' }));
  expect(container.querySelector('video')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Your first five minutes' })).toBeTruthy();
});

it('keeps a picture guide available after playback fails and resets for a different role', () => {
  const view = render(<VisualDashboardOrientation audience="learner" compact />);
  fireEvent.click(screen.getByRole('button', { name: 'Watch narrated video' }));
  fireEvent.error(view.container.querySelector('video')!);
  fireEvent.click(screen.getByRole('button', { name: 'Open the visual guide' }));
  expect(screen.getByRole('heading', { name: 'Your first five minutes' })).toBeTruthy();
  view.rerender(<VisualDashboardOrientation audience="host-shop" compact />);
  fireEvent.click(screen.getByRole('button', { name: 'Watch narrated video' }));
  expect(view.container.querySelector('source')?.getAttribute('src')).toBe(
    '/api/orientation/media/host-shop?format=mp4',
  );
  expect(screen.queryByText(/This video could not load/)).toBeNull();
});
