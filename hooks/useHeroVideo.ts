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
  // Track muted state — starts false (we attempt unmuted)
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    async function startPlay() {
      if (!el) return;
      // Attempt unmuted play first
      el.muted = false;
      el.volume = 0.8;
      try {
        await el.play();
        setMuted(false);
      } catch {
        // Browser blocked unmuted autoplay — fall back to muted
        el.muted = true;
        setMuted(true);
        try { await el.play(); } catch {}
      }
    }

    startPlay();

    if (!pauseOffScreen) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startPlay();
        else el.pause();
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pauseOffScreen, threshold]);

  // Toggle mute/unmute manually (for any component that still exposes a button)
  function unmute() {
    const el = videoRef.current;
    if (!el) return;

    if (!muted) {
      el.muted = true;
      setMuted(true);
      return;
    }

    el.muted = false;
    el.volume = 0.8;
    setMuted(false);
    el.play().catch(() => {
      el.muted = true;
      setMuted(true);
    });
  }

  return { videoRef, muted, unmute };
}
