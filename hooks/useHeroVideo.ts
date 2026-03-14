'use client';

import { useEffect, useRef } from 'react';

interface UseHeroVideoOptions {
  pauseOffScreen?: boolean;
  threshold?: number;
}

interface UseHeroVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export function useHeroVideo({
  pauseOffScreen = true,
  threshold = 0.2,
}: UseHeroVideoOptions = {}): UseHeroVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    async function startPlay() {
      if (!el) return;

      // Always start muted — required by autoplay policy on all browsers.
      // Unmuting before a user gesture causes jarring audio on page load.
      el.muted = true;
      el.volume = 1;
      try {
        await el.play();
      } catch {
        return; // autoplay blocked entirely — poster shows
      }

      // Unmute on first scroll or touch gesture
      const unmuteOnGesture = () => {
        if (!el) return;
        el.muted = false;
        window.removeEventListener('scroll', unmuteOnGesture, true);
        window.removeEventListener('touchmove', unmuteOnGesture, true);
        window.removeEventListener('click', unmuteOnGesture, true);
      };
      window.addEventListener('scroll', unmuteOnGesture, { capture: true, passive: true });
      window.addEventListener('touchmove', unmuteOnGesture, { capture: true, passive: true });
      window.addEventListener('click', unmuteOnGesture, { capture: true, passive: true });
    }

    if (!pauseOffScreen) {
      startPlay();
      return;
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

    return () => observer.disconnect();
  }, [pauseOffScreen, threshold]);

  return { videoRef };
}
