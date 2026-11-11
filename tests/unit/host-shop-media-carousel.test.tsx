import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HostShopMediaCarousel from '../../components/partners/HostShopMediaCarousel';

vi.mock('next/image', () => ({ default: ({ fill, unoptimized, fetchPriority, ...props }: Record<string, unknown>) => <img {...props} /> }));
vi.mock('../../components/partners/NarratedShopTour', () => ({ default: () => null }));
let visibility: (entries: { isIntersecting: boolean }[]) => void;
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof visibility) { visibility = callback; }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const items = [{ url: '/first.webp', alt: 'First photo' }, { url: '/second.webp', alt: 'Second photo' }];

describe('Host Shop mobile media loading', () => {
  it('loads one compact photo and leaves rotation paused until requested', () => {
    render(<HostShopMediaCarousel shopName="Test shop" compact items={items} />);
    expect(document.querySelectorAll('img')).toHaveLength(1);
    act(() => { visibility([{ isIntersecting: true }]); vi.advanceTimersByTime(15000); });
    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeTruthy();
    fireEvent.load(screen.getByAltText('First photo'));
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByAltText('Second photo')).toBeTruthy();
  });
  it('does not advance a playing gallery outside the viewport', () => {
    render(<HostShopMediaCarousel shopName="Test shop" items={items} />);
    act(() => { vi.advanceTimersByTime(15000); });
    expect(document.querySelectorAll('img')).toHaveLength(1);
    act(() => { visibility([{ isIntersecting: true }]); });
    expect(document.querySelectorAll('img')).toHaveLength(2);
  });
  it('shows a video-only shop without requiring a still photo or preloading the video', () => {
    render(<HostShopMediaCarousel shopName="Tour shop" compact items={[]} videoUrl="/tour.mp4" />);
    const video = screen.getByLabelText('Tour shop shop video');
    expect(video.getAttribute('src')).toBe('/tour.mp4');
    expect(video.getAttribute('preload')).toBe('none');
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
