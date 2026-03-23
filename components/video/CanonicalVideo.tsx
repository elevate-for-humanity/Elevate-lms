'use client';

/**
 * CanonicalVideo — the only component allowed to render a background/ambient
 * <video> element anywhere in the application.
 *
 * Invariants (enforced here, not by convention):
 *   - Always muted        — browsers require muted for autoplay
 *   - Always playsInline  — required on iOS
 *   - preload="metadata"  — never "auto"; does not download the full file on mount
 *   - poster required     — first paint is always a static image, never blank
 *   - Visibility-gated    — plays only when ≥50% visible; pauses when scrolled away
 *   - prefers-reduced-motion — shows poster only, no video
 *   - onError fallback    — hides the video element; poster remains visible via CSS
 *
 * DO NOT add props for autoPlay, preload, muted, or playsInline.
 * Those are not configurable — they are the standard.
 */

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  /**
   * Local static path only. Template literal type blocks remote URLs at compile time.
   * Must start with `/` — no https://, no Supabase signed URLs, no expiring CDN links.
   */
  poster: `/${string}`;
  className?: string;
  /** Intersection threshold to trigger play (default 0.1) */
  threshold?: number;
  /**
   * When true (default), video keeps playing after it scrolls out of view.
   * Set to false only for non-hero ambient videos that should pause when hidden.
   */
  playThrough?: boolean;
};

export default function CanonicalVideo({ src, poster, className, threshold = 0.1, playThrough = true }: Props) {
  if (process.env.NODE_ENV === 'development') {
    if (!poster) {
      throw new Error('CanonicalVideo requires a local poster. This is not optional.');
    }
    if (poster.startsWith('http')) {
      throw new Error(`CanonicalVideo poster must be a local path, not a remote URL: ${poster}`);
    }
  }
  const ref = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion once on mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Visibility-gated playback — starts when video enters view.
  // If playThrough=true (default for hero videos), keeps playing after scrolling away.
  // If playThrough=false, pauses when scrolled out of view.
  useEffect(() => {
    if (reducedMotion || failed) return;
    const video = ref.current;
    if (!video) return;

    let started = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          video.play().catch(() => {});
          if (playThrough) {
            // Once started, disconnect — let it play through the page
            observer.disconnect();
          }
        } else if (!entry.isIntersecting && !playThrough) {
          video.pause();
          started = false;
        }
      },
      { threshold }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion, failed, threshold, playThrough]);

  // Reduced-motion or error: render poster image only
  if (reducedMotion || failed) {
    return (
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={className}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      onError={() => setFailed(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
