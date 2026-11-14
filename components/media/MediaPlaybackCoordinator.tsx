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
      // Silent decorative autoplay must not stop a visitor's selected demo.
      // Narrated tours deliberately pair a muted video with a separate voice track.
      if ((active.muted || active.volume === 0) && !active.hasAttribute('data-narrated-tour')) return;

      document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
        if (media !== active && !media.paused && (!media.muted && media.volume > 0 || media.hasAttribute('data-narrated-tour'))) media.pause();
      });
    };

    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);

  return null;
}
