'use client';

/**
 * useHeroVideo
 *
 * Autoplay + unmute lifecycle for hero background videos.
 *
 * Browser autoplay policy requires videos to start muted. We unmute on the
 * first user gesture anywhere on the page (scroll, click, keydown, touchstart)
 * — this satisfies the policy on all browsers without requiring the user to
 * find and click a mute button. No mute button is shown.
 *
 * Usage:
 *   const { videoRef } = useHeroVideo();
 *   <video ref={videoRef} ... />
 */

import { useEffect, useRef } from 'react';

interface UseHeroVideoOptions {
  /** Pause when scrolled out of view (default: true) */
  pauseOffScreen?: boolean;
  /** IntersectionObserver threshold to trigger play (default: 0.2) */
  threshold?: number;
}

interface UseHeroVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
}

// Module-level flag: once any user gesture fires, all videos on the page unmute.
const gestureListeners: Set<() => void> = new Set();
let gestureReceived = false;

function onFirstGesture() {
  if (gestureReceived) return;
  gestureReceived = true;
  gestureListeners.forEach((fn) => fn());
  gestureListeners.clear();
  // Clean up page-level listeners
  ['click', 'keydown', 'scroll', 'touchstart'].forEach((evt) =>
    window.removeEventListener(evt, onFirstGesture, { capture: true } as EventListenerOptions)
  );
}

// Attach page-level gesture listeners once
if (typeof window !== 'undefined') {
  ['click', 'keydown', 'scroll', 'touchstart'].forEach((evt) =>
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

    // Must start muted — browsers block unmuted autoplay
    el.muted = true;
    el.volume = 1;

    function doUnmute() {
      if (!el) return;
      el.muted = false;
    }

    function startPlay() {
      if (!el) return;
      el.play().catch(() => {
        // Autoplay blocked entirely — nothing to do, poster shows
      });
      // Unmute immediately if gesture already received, otherwise queue
      if (gestureReceived) {
        doUnmute();
      } else {
        gestureListeners.add(doUnmute);
      }
    }

    if (!pauseOffScreen) {
      startPlay();
      return () => { gestureListeners.delete(doUnmute); };
    }

    // If already in viewport on mount, start immediately
    const rect = el.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startPlay();
        } else {
          el.pause();
        }
      },
      { threshold: inView ? 0 : threshold }
    );

    observer.observe(el);
    if (inView) startPlay();

    return () => {
      observer.disconnect();
      gestureListeners.delete(doUnmute);
    };
  }, [pauseOffScreen, threshold]);

  return { videoRef };
}
