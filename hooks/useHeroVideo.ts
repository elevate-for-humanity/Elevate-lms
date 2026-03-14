'use client';

import { useEffect, useRef, useState } from 'react';

interface UseHeroVideoOptions {
  pauseOffScreen?: boolean;
  threshold?: number;
}

interface UseHeroVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  muted: boolean;
  unmute: () => void;
}

export function useHeroVideo({
  pauseOffScreen = true,
  threshold = 0.3,
}: UseHeroVideoOptions = {}): UseHeroVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Always start muted — browsers allow muted autoplay universally.
    el.muted = true;
    el.volume = 1; // pre-set so unmute is instant

    async function startPlay() {
      if (!el) return;
      try {
        await el.play();
      } catch {
        // Autoplay blocked entirely — poster stays visible
      }
    }

    if (!pauseOffScreen) {
      startPlay();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startPlay();
        } else {
          el.pause();
        }
      },
      { threshold }
    );

    observer.observe(el);

    // If already in view on mount, play immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      startPlay();
    }

    return () => observer.disconnect();
  }, [pauseOffScreen, threshold]);

  function unmute() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    setMuted(false);
    el.play().catch(() => {
      el.muted = true;
      setMuted(true);
    });
  }

  return { videoRef, muted, unmute };
}
