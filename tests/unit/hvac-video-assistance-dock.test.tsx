// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrollNarrator } from '@/components/home/ScrollNarrator';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';
import { HvacVideoAssistanceDock } from '@/components/programs/HvacVideoAssistanceDock';
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
  main.innerHTML = '<video data-hvac-hero-video="20261029"></video><div data-hvac-video-assistance="ready"></div><section data-scroll-narration data-narration="HVAC course information"></section>';
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
  it('waits for the server-rendered container to hydrate before portaling into it', async () => {
    const html = renderToString(<HvacVideoAssistanceDock />);
    expect(html).not.toContain('data-hvac-video-assistance');
    const main = document.createElement('main');
    main.innerHTML = '<video data-hvac-hero-video="20261029"></video><section></section>';
    const host = main.querySelector('section')!;
    host.innerHTML = html;
    document.body.append(main);
    render(<ParisFloatingButton />);
    await showFilm(true);
    expect(host.querySelector('button')).toBeNull();
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(host, <HvacVideoAssistanceDock />, {
          onRecoverableError: error => { errors.push(error); },
        });
      });
      await showFilm(true);
      expect(host.querySelector('[data-hvac-video-assistance="ready"]')?.contains(
        screen.getByRole('button', { name: 'Open PARIS Career Assistant' }),
      )).toBe(true);
      expect(errors).toEqual([]);
    } finally {
      cleanup();
      await act(async () => { root?.unmount(); });
    }
  });

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

  it('rebinds both controls when React replaces the streamed hero', async () => {
    const oldDock = filmPage();
    render(<><ScrollNarrator /><ParisFloatingButton /></>);
    await showFilm(true);
    expect(oldDock.children.length).toBe(2);
    let newDock: Element | undefined;
    await act(async () => {
      oldDock.closest('main')!.remove();
      newDock = filmPage();
    });
    await showFilm(true);
    expect(newDock?.contains(screen.getByRole('button', { name: 'Open PARIS Career Assistant' }))).toBe(true);
    expect(newDock?.contains(screen.getByRole('button', { name: 'Stop page narration' }))).toBe(true);
    expect(document.querySelectorAll('[data-public-video-overlay]')).toHaveLength(0);
  });
});
