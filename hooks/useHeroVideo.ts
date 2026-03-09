'use client';

/**
 * useHeroVideo
 *
 * Handles the autoplay + unmute lifecycle for hero background videos.
 *
 * Browser policy: unmuted autoplay is blocked by default. The only reliable
 * way to autoplay is to start muted, then immediately attempt to unmute.
 * On desktop Chrome/Firefox this succeeds silently. On mobile/Safari the
 * unmute is blocked and we surface a "Tap to unmute" button.
 *
 * Usage:
 *   const { videoRef, muted, unmute, showUnmuteButton } = useHeroVideo();
 *   <video ref={videoRef} ... />
 *   {showUnmuteButton && <button onClick={unmute}>Tap to unmute</button>}
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseHeroVideoOptions {
  /** Pause when scrolled out of view (default: true) */
  pauseOffScreen?: boolean;
  /** IntersectionObserver threshold to trigger play (default: 0.2) */
  threshold?: number;
}

interface UseHeroVideoReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Whether the video is currently muted */
  muted: boolean;
  /** Whether to show the tap-to-unmute overlay (browser blocked unmuted autoplay) */
  showUnmuteButton: boolean;
  /** Call this when the user taps the unmute button */
  unmute: () => void;
}

export function useHeroVideo({
  pauseOffScreen = true,
  threshold = 0.2,
}: UseHeroVideoOptions = {}): UseHeroVideoReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);

  const tryUnmute = useCallback((el: HTMLVideoElement) => {
    el.muted = false;
    // If the browser silently re-mutes (some mobile browsers do this),
    // detect it on the next tick and show the button.
    setTimeout(() => {
      if (el.muted) {
        setShowUnmuteButton(true);
      } else {
        setMuted(false);
        setShowUnmuteButton(false);
      }
    }, 100);
  }, []);

  const unmute = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = false;
    el.volume = 1;
    setMuted(false);
    setShowUnmuteButton(false);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Always start muted so autoplay is permitted
    el.muted = true;

    const startPlay = () => {
      el.play()
        .then(() => {
          // Play succeeded — now try to unmute
          tryUnmute(el);
        })
        .catch(() => {
          // Autoplay fully blocked (very rare) — show unmute button as play button
          setShowUnmuteButton(true);
        });
    };

    if (!pauseOffScreen) {
      startPlay();
      return;
    }

    // Play when visible, pause when scrolled away
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
    return () => observer.disconnect();
  }, [pauseOffScreen, threshold, tryUnmute]);

  return { videoRef, muted, showUnmuteButton, unmute };
}
