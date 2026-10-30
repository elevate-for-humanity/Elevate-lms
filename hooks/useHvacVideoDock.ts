'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Keep optional public assistance below the visible film, then float it again. */
export function useHvacVideoDock(enabled = true) {
  const pathname = usePathname();
  const [dock, setDock] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setDock(null);
    if (!enabled || pathname !== '/programs/hvac-technician') return;
    let active = true;
    let observer: IntersectionObserver | undefined;
    let video: Element | null = null;
    let target: HTMLElement | null = null;
    const attach = () => {
      if (!active || (observer && video?.isConnected && target?.isConnected)) return;
      const nextVideo = document.querySelector('main video[data-hvac-hero-video]');
      const nextTarget = document.querySelector<HTMLElement>('[data-hvac-video-assistance]');
      if (nextVideo === video && nextTarget === target) return;
      observer?.disconnect();
      observer = undefined;
      video = nextVideo;
      target = nextTarget;
      setDock(null);
      if (!video || !target) return;
      const observedVideo = video;
      const observedTarget = target;
      observer = new IntersectionObserver(entries => {
        if (!active || !observedVideo.isConnected || !observedTarget.isConnected) return;
        for (const entry of entries) {
          if (entry.target === observedVideo) setDock(entry.isIntersecting ? observedTarget : null);
        }
      });
      observer.observe(video);
    };
    // Discover streamed markup and reattach after a page subtree is replaced.
    const waiting = new MutationObserver(attach);
    waiting.observe(document.body, { childList: true, subtree: true });
    attach();
    return () => {
      active = false;
      observer?.disconnect();
      waiting.disconnect();
    };
  }, [enabled, pathname]);

  return dock;
}
