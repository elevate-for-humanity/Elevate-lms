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
      el.muted = false;
      el.volume = 1;
      try {
        await el.play();
      } catch {
        // Browser blocked unmuted autoplay — fall back to muted
        el.muted = true;
        try { await el.play(); } catch { /* poster shows */ }
      }
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
