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
  it('reports loading failures only for the current gallery after its items change', () => {
    const { rerender } = render(<HostShopMediaCarousel shopName="Shop" items={[items[0]]} />);
    fireEvent.error(screen.getByAltText('First photo'));
    expect(screen.getByRole('status')).toHaveTextContent('could not load');
    rerender(<HostShopMediaCarousel shopName="Shop" items={[items[1]]} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.error(screen.getByAltText('Second photo'));
    expect(screen.getByRole('status')).toHaveTextContent('could not load');
  });
  it('loads one offscreen compact photo and rotates when visible', () => {
    render(<HostShopMediaCarousel shopName="Test shop" compact items={items} />);
    expect(document.querySelectorAll('img')).toHaveLength(1);
    expect(screen.getByAltText('First photo')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByAltText('First photo')).toHaveAttribute('sizes', '(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 400px');
    act(() => { visibility([{ isIntersecting: true }]); });
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeTruthy();
    fireEvent.load(screen.getByAltText('First photo'));
    // The public image audit must inspect only the displayed, decoded image.
    // The preloaded second frame is intentionally aria-hidden while pending.
    expect(screen.getByAltText('First photo')).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByAltText('Second photo')).toHaveAttribute('aria-hidden', 'true');
    expect(document.querySelectorAll('img:not([aria-hidden="true"])')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByAltText('Second photo')).toBeTruthy();
  });
  it('does not advance a playing gallery outside the viewport', () => {
    render(<HostShopMediaCarousel shopName="Test shop" items={items} />);
    act(() => { vi.advanceTimersByTime(15000); });
    expect(document.querySelectorAll('img')).toHaveLength(1);
    act(() => { visibility([{ isIntersecting: true }]); });
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(screen.getByAltText('First photo')).toHaveAttribute('loading', 'eager');
    expect(screen.getByAltText('Second photo')).toHaveAttribute('loading', 'lazy');
  });
  it('starts paused for reduced motion and still supports manual navigation', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    render(<HostShopMediaCarousel shopName="Shop" compact items={items} />);
    act(() => { visibility([{ isIntersecting: true }]); });
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeTruthy();
    expect(document.querySelectorAll('img')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByAltText('Second photo')).toBeTruthy();
    matchMedia.mockRestore();
  });
  it('does not restart a manual pause when reduced motion is disabled', () => {
    let notify = () => {};
    const preference = {
      matches: false,
      addEventListener: (_type: string, callback: () => void) => { notify = callback; },
      removeEventListener: vi.fn(),
    };
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue(preference as unknown as MediaQueryList);
    render(<HostShopMediaCarousel shopName="Shop" compact items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => { preference.matches = true; notify(); });
    act(() => { preference.matches = false; notify(); });
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeTruthy();
    matchMedia.mockRestore();
  });
  it('shows a video-only shop without requiring a still photo or preloading the video', () => {
    render(<HostShopMediaCarousel shopName="Tour shop" compact items={[]} videoUrl="/tour.mp4" />);
    const video = screen.getByLabelText('Tour shop shop video');
    expect(video.getAttribute('src')).toBe('/tour.mp4');
    expect(video.getAttribute('preload')).toBe('none');
    expect((video as HTMLVideoElement).muted).toBe(false);
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
