'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Keep optional public assistance below the visible film, then float it again. */
export function useHvacVideoDock(enabled = true) {
  const pathname = usePathname();
  const [dock, setDock] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setDock(null);
    if (!enabled) return;
    let active = true;
    let observer: IntersectionObserver | undefined;
    let waiting: MutationObserver | undefined;
    const attach = () => {
      if (!active || observer) return true;
      const video = document.querySelector('main video[data-hvac-hero-video]');
      const target = document.querySelector<HTMLElement>('[data-hvac-video-assistance]');
      if (!video || !target) return false;
      observer = new IntersectionObserver(entries => {
        if (!active) return;
        for (const entry of entries) {
          if (entry.target === video) setDock(entry.isIntersecting ? target : null);
        }
      });
      observer.observe(video);
      return true;
    };
    // App Router can stream the page after the shared layout has mounted.
    if (!attach()) {
      waiting = new MutationObserver(() => { if (attach()) waiting?.disconnect(); });
      waiting.observe(document.body, { childList: true, subtree: true });
    }
    return () => {
      active = false;
      observer?.disconnect();
      waiting?.disconnect();
    };
  }, [enabled, pathname]);

  return dock;
}
