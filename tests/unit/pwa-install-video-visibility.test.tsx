// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';

vi.mock('next/navigation', () => ({ usePathname: () => '/programs/hvac-technician' }));
vi.mock('@/hooks/usePwaInstall', () => ({
  usePwaInstall: () => ({ canInstall: false, isInstalled: false, platform: 'ios', promptInstall: vi.fn(), dismiss: vi.fn() }),
}));

let update: IntersectionObserverCallback;
let observer: IntersectionObserver;
const observe = vi.fn();
const disconnect = vi.fn();
const entry = (target: Element, isIntersecting: boolean): IntersectionObserverEntry => ({
  target, isIntersecting, time: 0, rootBounds: null, intersectionRatio: isIntersecting ? 1 : 0,
  boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(),
});
beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  vi.stubGlobal('IntersectionObserver', class implements IntersectionObserver {
    constructor(callback: IntersectionObserverCallback) { update = callback; observer = this; }
    root = null;
    rootMargin = '0px';
    thresholds = [0];
    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
    takeRecords = () => [];
  });
});
afterEach(() => { cleanup(); document.querySelector('main')?.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('PWA install prompt around video playback', () => {
  it('keeps the film and native controls clear, and restores installation after scrolling past the film', () => {
    const main = document.createElement('main');
    const video = document.createElement('video');
    main.append(video);
    document.body.append(main);
    const view = render(<PwaInstallBanner />);
    expect(observe).toHaveBeenCalledWith(video);
    act(() => {
      update([entry(video, true)], observer);
      vi.advanceTimersByTime(8000);
    });
    expect(screen.queryByRole('complementary', { name: 'Install Elevate app' })).toBeNull();
    act(() => update([entry(video, false)], observer));
    expect(screen.getByRole('complementary', { name: 'Install Elevate app' })).toBeTruthy();
    act(() => update([entry(video, true)], observer));
    expect(screen.queryByRole('complementary', { name: 'Install Elevate app' })).toBeNull();
    view.unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('preserves iPhone installation instructions and dismissal on pages without a film', () => {
    render(<PwaInstallBanner />);
    act(() => vi.advanceTimersByTime(8000));
    fireEvent.click(screen.getByRole('button', { name: 'How to Install' }));
    expect(screen.getByText(/In Safari, tap Share/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss install prompt' }));
    expect(screen.queryByRole('complementary', { name: 'Install Elevate app' })).toBeNull();
    expect(window.localStorage.getItem('pwa-install-banner-dismissed')).toBe('1');
  });
});
