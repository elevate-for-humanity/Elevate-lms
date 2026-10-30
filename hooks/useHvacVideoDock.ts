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
      if (!active) return;
      const nextVideo = document.querySelector('main video[data-hvac-hero-video]');
      const nextTarget = document.querySelector<HTMLElement>('[data-hvac-video-assistance="ready"]');
      if (nextVideo === video && nextTarget === target) return;
      observer?.disconnect();
      video = nextVideo;
      target = nextTarget;
      setDock(null);
      if (!video || !target) return;
      const observedVideo = video;
      const observedTarget = target;
      observer = new IntersectionObserver(entries => {
        if (!active || video !== observedVideo || target !== observedTarget ||
          !observedVideo.isConnected || !observedTarget.isConnected) return;
        for (const entry of entries) {
          if (entry.target === observedVideo) setDock(entry.isIntersecting ? observedTarget : null);
        }
      });
      observer.observe(observedVideo);
    };
    // Streaming and hydration recovery can replace an already discovered hero.
    // Observe only on this route, and rebind only when the actual nodes change.
    const changes = new MutationObserver(attach);
    changes.observe(document.body, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['data-hvac-video-assistance'],
    });
    attach();
    return () => {
      active = false;
      observer?.disconnect();
      changes.disconnect();
    };
  }, [enabled, pathname]);

  return dock;
}
