'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const storePath = '/sites/meri-gold-round';
const preferenceKey = 'meri-gold-round:background-music';
const MusicContext = createContext<{
  on: boolean;
  toggle: () => void;
  setFilmAudible: (active: boolean) => void;
} | null>(null);

export function useStoreMusic() { return useContext(MusicContext); }

export function StoreMusicSwitch() {
  const music = useStoreMusic();
  if (!music) return null;
  return <button type="button" data-music-switch aria-label="Background music" aria-pressed={music.on}
    onClick={music.toggle}>Music {music.on ? 'on' : 'off'}</button>;
}

export function MeriStoreMusic({ children }: { children: ReactNode }) {
  const router = useRouter();
  const audio = useRef<HTMLAudioElement>(null);
  const enabled = useRef(true);
  const filmAudible = useRef(false);
  const [on, setOn] = useState(false);

  const sync = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (!enabled.current || filmAudible.current || document.hidden) {
      el.pause();
      return;
    }
    if (el.paused) void el.play().catch(() => {});
  }, []);
  const setFilmAudible = useCallback((active: boolean) => {
    filmAudible.current = active;
    sync();
  }, [sync]);

  useEffect(() => {
    try { enabled.current = sessionStorage.getItem(preferenceKey) !== 'off'; } catch { /* Storage is optional. */ }
    sync();
    // Phones may require the first tap before starting audible media.
    const unlock = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('[data-music-switch]')) return;
      sync();
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [sync]);

  function toggle() {
    enabled.current = !(on || (filmAudible.current && enabled.current));
    try { sessionStorage.setItem(preferenceKey, enabled.current ? 'on' : 'off'); } catch { /* Storage is optional. */ }
    setOn(enabled.current);
    sync();
  }
  // Builder pages include plain anchors. Keep this layout and its audio mounted
  // for in-store visits; preserve normal behavior for hash, external and new-tab links.
  function navigate(e: MouseEvent<HTMLDivElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
    const dest = new URL(a.href);
    if (dest.origin !== location.origin || !(dest.pathname === storePath || dest.pathname.startsWith(storePath + '/'))) return;
    if (dest.pathname === location.pathname && dest.search === location.search) return;
    e.preventDefault();
    router.push(dest.pathname + dest.search + dest.hash);
  }

  return <MusicContext.Provider value={{ on: on || (filmAudible.current && enabled.current), toggle, setFilmAudible }}>
    <audio ref={audio} loop preload="none" src="/audio/meri-gold-round/browsing-music.mp3"
      onPlaying={() => setOn(true)} onPause={() => setOn(false)} />
    <div onClick={navigate}>{children}</div>
  </MusicContext.Provider>;
}
