import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import HostShopPreviewBoundary from '@/components/host-shop/HostShopPreviewBoundary';
import { HOST_SHOP_PREVIEW_MARKER } from '@/lib/partners/host-shop-preview-marker';

afterEach(() => {
  cleanup();
  document.cookie = `${HOST_SHOP_PREVIEW_MARKER}=; max-age=0; path=/`;
});

it('blocks a stale shop interaction before it can navigate or save', () => {
  document.cookie = `${HOST_SHOP_PREVIEW_MARKER}=first; path=/`;
  const action = vi.fn();
  render(<HostShopPreviewBoundary marker="first"><button onClick={action}>Shop profile</button></HostShopPreviewBoundary>);
  fireEvent.click(screen.getByRole('button'));
  expect(action).toHaveBeenCalledTimes(1);
  document.cookie = `${HOST_SHOP_PREVIEW_MARKER}=next; path=/`;
  fireEvent.click(screen.getByRole('button'));
  expect(action).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('link', { name: 'Choose a Host Shop' })).toBeTruthy();
});
