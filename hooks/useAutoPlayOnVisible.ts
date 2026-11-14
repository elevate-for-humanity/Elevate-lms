'use client';

import { useEffect } from 'react';

export function useAutoPlayOnVisible(
  ref: React.RefObject<HTMLVideoElement>,
  enabled: boolean = true,
  options?: IntersectionObserverInit,
) {
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = ref.current;
          if (!video) return;

          if (entry.isIntersecting) {
            video.play().catch(() => {
              // some browsers block autoplay, ignore
            });
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: 0.6,
        ...options,
      },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [ref, enabled, options]);
}
