'use client';

/**
 * useHeroVideo
 *
 * Autoplay lifecycle for hero background videos.
 *
 * Strategy:
 *   1. Attempt unmuted autoplay immediately (works on Chrome/Firefox desktop).
 *   2. If the browser rejects it (Safari, mobile), fall back to muted autoplay.
 *   3. On the first user gesture (click, scroll, keydown, touchstart) unmute
 *      any video still muted — satisfies Safari's policy.
 *
 * No mute button is shown. No user action required on browsers that permit
 * unmuted autoplay.
 */

import { useEffect, useRef } from 'react';

interface UseHeroVideoOptions {
  pauseOffScreen?: boolean;
  threshold?: number;
}

interface UseHeroVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Module-level: shared across all hero videos on the page.
const pendingUnmute: Set<() => void> = new Set();
let gestureReceived = false;

function onFirstGesture() {
  if (gestureReceived) return;
  gestureReceived = true;
  pendingUnmute.forEach((fn) => fn());
  pendingUnmute.clear();
  (['click', 'keydown', 'scroll', 'touchstart'] as const).forEach((evt) =>
    window.removeEventListener(evt, onFirstGesture, { capture: true } as EventListenerOptions)
  );
}

if (typeof window !== 'undefined') {
  (['click', 'keydown', 'scroll', 'touchstart'] as const).forEach((evt) =>
    window.addEventListener(evt, onFirstGesture, { capture: true, passive: true })
  );
}

export function useHeroVideo({
  pauseOffScreen = true,
  threshold = 0.2,
}: UseHeroVideoOptions = {}): UseHeroVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Hoist doUnmute to effect scope so cleanup can remove it from pendingUnmute
    // if the component unmounts before the first gesture fires.
    const doUnmute = () => {
      if (!el) return;
      el.muted = false;
      el.volume = 1;
    };

    async function startPlay() {
      if (!el) return;

      // Attempt 1: unmuted autoplay (works on most desktop browsers)
      el.muted = false;
      el.volume = 1;
      try {
        await el.play();
        return; // playing with sound — done
      } catch {
        // Browser blocked unmuted autoplay — fall back to muted
      }

      // Attempt 2: muted autoplay (always permitted)
      el.muted = true;
      try {
        await el.play();
      } catch {
        return; // autoplay blocked entirely — poster shows
      }

      // Queue unmute for first user gesture
      if (gestureReceived) {
        doUnmute();
      } else {
        pendingUnmute.add(doUnmute);
      }
    }

    if (!pauseOffScreen) {
      startPlay();
      return () => {
        pendingUnmute.delete(doUnmute);
      };
    }

    const rect = el.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startPlay();
        } else {
          el.pause();
        }
      },
      { threshold: alreadyInView ? 0 : threshold }
    );

    observer.observe(el);
    if (alreadyInView) startPlay();

    return () => {
      observer.disconnect();
      pendingUnmute.delete(doUnmute);
    };
  }, [pauseOffScreen, threshold]);

  return { videoRef };
}
