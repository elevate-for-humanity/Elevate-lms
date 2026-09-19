'use client';

import { useEffect } from 'react';

/**
 * Enforces one audible media source at a time across the public site.
 * Starting any video or audio pauses every other playing media element.
 */
export function MediaPlaybackCoordinator() {
  useEffect(() => {
    const handlePlay = (event: Event) => {
      const active = event.target;
      if (!(active instanceof HTMLMediaElement)) return;

      document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
        if (media !== active && !media.paused) media.pause();
      });
    };

    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);

  return null;
}
