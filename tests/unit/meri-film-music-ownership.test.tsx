import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MediaPlaybackCoordinator } from '@/components/media/MediaPlaybackCoordinator';
import { MeriStoreMusic } from '@/components/tenant/MeriStoreMusic';
import { WellnessStorefront } from '@/components/tenant/WellnessStorefront';
import type { PublishedTenantSite } from '@/lib/tenant/site-types';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); sessionStorage.clear(); });

it('claims the soundtrack before the film tap bubbles, keeps film playback through rerenders, and resumes music on pause', async () => {
  const paused = new WeakMap<HTMLMediaElement, boolean>();
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function () { return paused.get(this) ?? true; });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    const media = this;
    paused.set(media, false);
    queueMicrotask(() => { if (!media.paused) { fireEvent.play(media); fireEvent.playing(media); } });
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
    if (!this.paused) { paused.set(this, true); fireEvent.pause(this); }
  });
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} });
  const site = { id: 'music-owner', subdomain: 'meri-gold-round', config: { products: [], contact: {}, footer: {} } } as unknown as PublishedTenantSite;
  render(<><MediaPlaybackCoordinator /><MeriStoreMusic><WellnessStorefront site={site} pathname="/" basePath="/sites/meri-gold-round">{null}</WellnessStorefront></MeriStoreMusic></>);
  const film = screen.getByLabelText('The Meri-Gold-Round brand film') as HTMLVideoElement;
  const audio = document.querySelector('audio')!;
  fireEvent.click(screen.getByRole('button', { name: 'Closed captions' }));
  await waitFor(() => expect(audio.paused).toBe(false));
  fireEvent.click(screen.getByRole('button', { name: 'Play film' }));
  await waitFor(() => { expect(film.paused).toBe(false); expect(audio.paused).toBe(true); });
  fireEvent.click(screen.getByRole('button', { name: 'Closed captions' }));
  await waitFor(() => { expect(film.paused).toBe(false); expect(audio.paused).toBe(true); });
  fireEvent.click(screen.getByRole('button', { name: 'Pause film' }));
  await waitFor(() => { expect(film.paused).toBe(true); expect(audio.paused).toBe(false); });
  fireEvent.click(screen.getByRole('button', { name: 'Background music' }));
  expect(audio.paused).toBe(true);
});
