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

    // Must start muted — required for autoplay across all browsers
    el.muted = true;
    el.volume = 1;

    let triggered = false;

    async function startPlay() {
      if (!el) return;
      try { await el.play(); } catch {}
    }

    // Trigger on scroll (80px), not on mount
    function onScroll() {
      if (triggered) return;
      if (window.scrollY < 80) return;
      triggered = true;
      window.removeEventListener('scroll', onScroll);
      startPlay();
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    if (!pauseOffScreen) return () => window.removeEventListener('scroll', onScroll);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!triggered) return;
        if (entry.isIntersecting) startPlay();
        else el.pause();
      },
      { threshold }
    );

    observer.observe(el);
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, [pauseOffScreen, threshold]);

  function unmute() {
    const el = videoRef.current;
    if (!el) return;

    if (!muted) {
      // Toggle back to muted
      el.muted = true;
      setMuted(true);
      // Also mute any audio track on the page
      const audio = document.getElementById('hero-audio') as HTMLAudioElement | null;
      if (audio) { audio.pause(); audio.currentTime = 0; }
      return;
    }

    // Unmute video
    el.muted = false;
    setMuted(false);

    // If there's a separate audio track, play it in sync
    const audio = document.getElementById('hero-audio') as HTMLAudioElement | null;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }

    // Fallback: if browser blocks unmuted video, stay muted silently
    el.play().catch(() => {
      el.muted = true;
      setMuted(true);
    });
  }

  return { videoRef, muted, unmute };
}
