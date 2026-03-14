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

      // Attempt unmuted first (works on desktop)
      el.muted = false;
      el.volume = 1;
      try {
        await el.play();
        return;
      } catch {
        // Browser requires a gesture first — start muted
      }

      // Muted autoplay (always allowed)
      el.muted = true;
      try {
        await el.play();
      } catch {
        return;
      }

      // Unmute on the next scroll event — scroll itself is the gesture
      const unmuteOnScroll = () => {
        if (!el) return;
        el.muted = false;
        el.volume = 1;
        window.removeEventListener('scroll', unmuteOnScroll, true);
        window.removeEventListener('touchmove', unmuteOnScroll, true);
      };
      window.addEventListener('scroll', unmuteOnScroll, { capture: true, passive: true });
      window.addEventListener('touchmove', unmuteOnScroll, { capture: true, passive: true });
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
