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
  /** Local static path. Never a signed URL or remote URL with expiry. */
  poster: string;
  className?: string;
  /** Intersection threshold to trigger play (default 0.5) */
  threshold?: number;
};

export default function CanonicalVideo({ src, poster, className, threshold = 0.5 }: Props) {
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

  // Visibility-gated playback — never plays on mount, only when in view
  useEffect(() => {
    if (reducedMotion || failed) return;
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion, failed, threshold]);

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
      loop
      preload="metadata"
      poster={poster}
      aria-hidden="true"
      onError={() => setFailed(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
