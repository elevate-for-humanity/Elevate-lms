'use client';

import { useEffect } from 'react';

/**
 * Enforces one audible playback group at a time across the public site.
 * A deliberately grouped narration and music bed may play together.
 */
export function MediaPlaybackCoordinator() {
  useEffect(() => {
    const handlePlay = (event: Event) => {
      const active = event.target;
      if (!(active instanceof HTMLMediaElement)) return;
      // Silent decorative autoplay must not stop a visitor's selected demo.
      // Narrated tours deliberately pair a muted video with a separate voice track.
      if ((active.muted || active.volume === 0) && !active.hasAttribute('data-narrated-tour')) return;

      const group = active.closest('[data-media-playback-group]');
      document.querySelectorAll<HTMLMediaElement>('video, audio').forEach((media) => {
        if (group && media.closest('[data-media-playback-group]') === group) return;
        if (media !== active && !media.paused && (!media.muted && media.volume > 0 || media.hasAttribute('data-narrated-tour'))) media.pause();
      });
    };

    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);

  return null;
}
