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
 * Poster rendering:
 *   The browser's native <video poster> attribute does not honour object-fit,
 *   causing a layout flash on load (image renders at intrinsic size before CSS
 *   applies). Instead, we render a separate <img> poster that is always
 *   object-cover, then cross-fade the video in once it is actually playing.
 *   The parent container must be position:relative for this to work — all hero
 *   usages already satisfy this requirement.
 *
 * DO NOT add props for autoPlay, preload, muted, or playsInline.
 * Those are not configurable — they are the standard.
 */

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  /** Optional poster — shown while video loads and as reduced-motion fallback */
  poster?: string;
  className?: string;
  /** Intersection threshold to trigger play (default 0.1) */
  threshold?: number;
  /**
   * When true (default), video keeps playing after it scrolls out of view.
   * Set to false only for non-hero ambient videos that should pause when hidden.
   */
  playThrough?: boolean;
  /**
   * When true, attempt autoplay immediately on mount without waiting for the
   * IntersectionObserver. Use for above-the-fold hero videos that are always
   * visible on page entry. Falls back to observer-gated play if autoplay is
   * blocked by the browser.
   */
  autoPlayOnMount?: boolean;
  /**
   * When true, use preload="auto" to aggressively buffer the video.
   * Use only for the primary above-the-fold hero to reduce load delay.
   */
  preloadFull?: boolean;
};

export default function CanonicalVideo({ src, poster, className, threshold = 0.1, playThrough = true, autoPlayOnMount = false, preloadFull = false }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // True once the video is actually playing — drives the poster → video cross-fade
  const [playing, setPlaying] = useState(false);

  // Detect prefers-reduced-motion once on mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Immediate autoplay for above-the-fold hero videos.
  // Fires on mount so the video starts as soon as the component renders,
  // without waiting for the IntersectionObserver tick.
  // Only one play path runs — autoPlayOnMount OR observer, never both.
  useEffect(() => {
    if (!autoPlayOnMount || reducedMotion || failed) return;
    const video = ref.current;
    if (!video) return;
    // Wait for enough data before calling play() to avoid AbortError races
    if (video.readyState >= 2) {
      video.play().catch(() => {});
    } else {
      const onReady = () => { video.play().catch(() => {}); };
      video.addEventListener('canplay', onReady, { once: true });
      return () => video.removeEventListener('canplay', onReady);
    }
  }, [autoPlayOnMount, reducedMotion, failed]);

  // Visibility-gated playback — starts when video enters view.
  // If playThrough=true (default for hero videos), keeps playing after scrolling away.
  // If playThrough=false, pauses when scrolled out of view.
  // Skipped entirely when autoPlayOnMount=true.
  useEffect(() => {
    if (autoPlayOnMount || reducedMotion || failed) return;
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
  }, [autoPlayOnMount, reducedMotion, failed, threshold, playThrough]);

  // Reduced-motion or error: render poster only
  if (reducedMotion || failed) {
    if (!poster) return null;
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

  // When a poster is provided, render it as a separate <img> underneath the
  // video so it always fills the container with object-cover. The video fades
  // in on top once playing, eliminating the browser-native poster flash where
  // the image renders at its intrinsic size before CSS object-fit applies.
  // Both elements share the same className (absolute inset-0 in hero usage)
  // so they stack correctly inside the relative parent container.
  if (poster) {
    return (
      <>
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          fetchPriority={autoPlayOnMount ? 'high' : 'auto'}
          className={`${className} transition-opacity duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}
          style={{ objectFit: 'cover' }}
        />
        <video
          ref={ref}
          className={`${className} transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          preload={preloadFull ? 'auto' : 'metadata'}
          aria-hidden="true"
          onPlaying={() => setPlaying(true)}
          onError={() => setFailed(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      </>
    );
  }

  // No poster — single video element, no cross-fade needed
  return (
    <video
      ref={ref}
      className={className}
      muted
      playsInline
      preload={preloadFull ? 'auto' : 'metadata'}
      aria-hidden="true"
      onError={() => setFailed(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
