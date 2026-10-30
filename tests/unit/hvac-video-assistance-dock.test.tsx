// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollNarrator } from '@/components/home/ScrollNarrator';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import { HvacLabHero } from '@/components/programs/HvacTrainingShowcase';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';

const voice = vi.hoisted(() => ({ play: vi.fn(), prepare: vi.fn(), stop: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/programs/hvac-technician' }));
vi.mock('@/components/voice/useNaturalVoice', () => ({
  useNaturalVoice: () => voice,
  stopAllNaturalVoicePlayback: vi.fn(),
}));
// Keep this positioning/state regression independent of chat's network/voice stack.
vi.mock('react', async importOriginal => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, lazy: () => () => react.createElement('textarea', {
    'aria-label': 'Chat message', defaultValue: 'Unsent question',
  }) };
});

const observers: Array<{
  callback: IntersectionObserverCallback;
  observer: IntersectionObserver;
  targets: Set<Element>;
}> = [];

async function showFilm(isIntersecting: boolean) {
  await act(async () => {
    for (const record of observers) {
      const entries = [...record.targets].filter(target => target.tagName === 'VIDEO').map(target => ({
        target, isIntersecting, time: 0, rootBounds: null, intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: target.getBoundingClientRect(), intersectionRect: target.getBoundingClientRect(),
      }));
      if (entries.length) record.callback(entries, record.observer);
    }
  });
}

function filmPage() {
  const main = document.createElement('main');
  main.innerHTML = '<video data-hvac-hero-video="20261029"></video><div data-hvac-video-assistance></div><section data-scroll-narration data-narration="HVAC course information"></section>';
  document.body.append(main);
  return main.querySelector('[data-hvac-video-assistance]')!;
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  observers.length = 0;
  voice.play.mockResolvedValue(true);
  voice.prepare.mockResolvedValue(true);
  vi.stubGlobal('IntersectionObserver', class implements IntersectionObserver {
    root = null;
    rootMargin = '0px';
    thresholds = [0];
    targets = new Set<Element>();
    constructor(callback: IntersectionObserverCallback) {
      observers.push({ callback, observer: this, targets: this.targets });
    }
    observe = (target: Element) => { this.targets.add(target); };
    unobserve = (target: Element) => { this.targets.delete(target); };
    disconnect = () => { this.targets.clear(); };
    takeRecords = () => [];
  });
});
afterEach(() => {
  cleanup();
  document.querySelectorAll('main').forEach(main => main.remove());
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('public assistance around the HVAC film', () => {
  it('moves both controls below the visible film and restores floating controls without losing narration preference', async () => {
    const dock = filmPage();
    render(<><ScrollNarrator /><ParisFloatingButton /></>);
    expect(dock.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(false);
    await showFilm(true);
    expect(dock.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
    expect(dock.contains(screen.getByRole('button', { name: 'Stop page narration' }))).toBe(true);
    expect(document.querySelectorAll('[data-public-video-overlay]')).toHaveLength(0);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Stop page narration' })); });
    await showFilm(false);
    expect(dock.children).toHaveLength(0);
    expect(localStorage.getItem('elevate:scroll-narration')).toBe('off');
    expect(screen.getByRole('button', { name: 'Play narration for this section' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: 'Open PARIS Career Assistant' })).toBeTruthy();
  });

  it('preserves an open conversation and unsent text while the film enters view', async () => {
    vi.useRealTimers();
    filmPage();
    render(<ParisFloatingButton />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Open PARIS Career Assistant' })); });
    const dialog = screen.getByRole('dialog');
    const input = await screen.findByRole('textbox', { name: 'Chat message' }) as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'My question about HVAC funding' } });
    await showFilm(true);
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(input.value).toBe('My question about HVAC funding');
  });

  it('retains the learner assistant in its portal position', async () => {
    const dock = filmPage();
    render(<ParisFloatingButton surface="learner" />);
    await showFilm(true);
    expect(screen.getByRole('button', { name: 'Need help? Open PARIS' })).toBeTruthy();
    expect(dock.children).toHaveLength(0);
  });

  it('discovers a hero streamed after the shared public layout mounts', async () => {
    render(<ParisFloatingButton />);
    let dock: Element | undefined;
    await act(async () => { dock = filmPage(); });
    await showFilm(true);
    expect(dock?.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
  });

  it('does not mutate server-rendered hero HTML before hydration or replace the native player', async () => {
    vi.useRealTimers();
    const host = document.createElement('main');
    host.innerHTML = renderToString(<HvacLabHero />);
    document.body.append(host);
    const originalVideo = host.querySelector('video');
    if (!originalVideo) throw new Error('The server-rendered hero must contain its native player');
    // jsdom does not initialize the live muted property from the SSR attribute.
    originalVideo.muted = originalVideo.defaultMuted;
    expect(host.querySelector('[data-hvac-video-assistance]')).toBeNull();
    render(<ParisFloatingButton />);
    await showFilm(true);
    expect(host.querySelector('[data-hvac-video-assistance]')).toBeNull();
    const recoverableError = vi.fn();
    const hydrationWarning = vi.spyOn(console, 'error');
    let unmount = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(host, <HvacLabHero />, { onRecoverableError: recoverableError });
        unmount = () => root.unmount();
      });
      await showFilm(true);
      const dock = host.querySelector('[data-hvac-video-assistance]');
      expect(dock?.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
      expect(host.querySelector('video')).toBe(originalVideo);
      expect(recoverableError).not.toHaveBeenCalled();
      expect(hydrationWarning).not.toHaveBeenCalled();
    } finally {
      await act(async () => unmount());
      hydrationWarning.mockRestore();
    }
  });

  it('reattaches to a replacement page subtree instead of retaining detached elements', async () => {
    const oldDock = filmPage();
    render(<ParisFloatingButton />);
    await showFilm(true);
    expect(oldDock.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
    let newDock: Element | undefined;
    await act(async () => {
      document.querySelector('main')!.remove();
      newDock = filmPage();
    });
    await showFilm(true);
    expect(newDock?.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
    expect(oldDock.children).toHaveLength(0);
  });
});
