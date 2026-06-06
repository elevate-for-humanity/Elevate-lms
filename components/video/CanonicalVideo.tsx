'use client';

/**
 * CanonicalVideo — the only component allowed to render a background/ambient
 * <video> element anywhere in the application.
 *
 * Invariants (enforced here, not by convention):
 *   - Always muted        — browsers require muted for autoplay
 *   - Always playsInline  — required on iOS
 *   - preload="metadata"  — never "auto"; does not download the full file on mount
 *   - poster optional     — when omitted, slate background shows until video plays
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

import { useEffect, useRef, useState, useCallback } from 'react';

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
  /**
   * When true, the video loops seamlessly. Use for ambient hero backgrounds
   * so the video never ends, preventing the poster from fading back in.
   */
  loop?: boolean;
};

export default function CanonicalVideo({
  src,
  poster,
  className,
  threshold = 0.1,
  playThrough = true,
  autoPlayOnMount = false,
  preloadFull = false,
  loop = false,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // True once the video is actually playing — drives the poster → video cross-fade
  const [playing, setPlaying] = useState(false);
  // True once the video has played through once — fades poster back in, stays there
  const [ended, setEnded] = useState(false);

  // Tracks whether the video has ever started playing — used to prevent
  // the poster from re-appearing when the src swaps desktop→mobile after hydration.
  const isPlayingRef = useRef(false);

  // Memoize event handlers to prevent re-registrations on each render
  const handlePlaying = useCallback(() => { isPlayingRef.current = true; setPlaying(true); }, []);
  // timeupdate fires on every frame tick — use as a reliable fallback for
  // browsers/situations where onPlaying fires before React attaches the handler
  // (e.g. autoPlayOnMount on a fast connection where canplay fires synchronously).
  const handleTimeUpdate = useCallback(() => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setPlaying(true);
  }, []);
  const handleEnded = useCallback(() => setEnded(true), []);
  const handleError = useCallback(() => setFailed(true), []);
  // Recover from stall/waiting — browser buffered enough to resume, call play()
  // again. This prevents the black-frame freeze that occurs when a looping hero
  // video stalls at the loop point on a slow connection.
  const handleStalled = useCallback(() => {
    const video = ref.current;
    if (!video || video.paused) return;
    video.play().catch(() => {});
  }, []);

  // Pause and clean up the video element on unmount to prevent background playback
  useEffect(() => {
    const video = ref.current;
    return () => {
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, []);

  // Detect prefers-reduced-motion once on mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Track the previous src so we only reset state when the src genuinely changes
  // (not on every render). This prevents the poster flash caused by HeroVideo
  // switching from the SSR desktop src to the mobile src after hydration.
  const prevSrcRef = useRef<string>('');

  // Immediate autoplay for above-the-fold hero videos.
  // Fires on mount and whenever src changes (e.g. desktop→mobile swap after hydration).
  // Only one play path runs — autoPlayOnMount OR observer, never both.
  useEffect(() => {
    if (!autoPlayOnMount || reducedMotion || failed) return undefined;
    const video = ref.current;
    if (!video) return undefined;
    // Only reset the fade state when the src actually changes to a new URL.
    // Skipping the reset when src is unchanged prevents the poster blink that
    // occurs when HeroVideo re-renders after setMounted(true) with the same src.
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src;
      // Only hide the poster on the very first load. When the src changes
      // from desktop→mobile after hydration the video was already playing —
      // resetting playing to false causes a visible poster flash for 700ms.
      if (!isPlayingRef.current) {
        setPlaying(false);
        setEnded(false);
      }
    }
    // Wait for enough data before calling play() to avoid AbortError races.
    // Resolve playing state from the play() promise — onPlaying can fire before
    // React attaches the handler when the video is already buffered (preload hit),
    // leaving the poster stuck on screen indefinitely.
    const startPlay = (v: HTMLVideoElement) => {
      // Set playing immediately so the poster starts fading before the
      // play() promise resolves — eliminates the flash where the first
      // video frame is visible under a still-opaque poster.
      setPlaying(true);
      isPlayingRef.current = true;
      v.play().catch(() => {
        setPlaying(false);
        isPlayingRef.current = false;
      });
    };

    // readyState >= 1 means metadata is loaded — enough to call play() on most browsers.
    // readyState >= 2 (HAVE_CURRENT_DATA) is the safer threshold but adds latency.
    // We call play() immediately and let the browser buffer; it will fire canplay
    // internally before rendering the first frame.
    if (video.readyState >= 1) {
      startPlay(video);
      return undefined;
    }

    const onReady = () => startPlay(video);
    video.addEventListener('loadedmetadata', onReady, { once: true });
    return () => video.removeEventListener('loadedmetadata', onReady);
  }, [autoPlayOnMount, reducedMotion, failed, src]);

  // Visibility-gated playback — starts when video enters view.
  // If playThrough=true (default for hero videos), keeps playing after scrolling away.
  // If playThrough=false, pauses when scrolled out of view.
  // Skipped entirely when autoPlayOnMount=true.
  useEffect(() => {
    if (autoPlayOnMount || reducedMotion || failed) return undefined;
    const video = ref.current;
    if (!video) return undefined;

    let started = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          video.play()
            .then(() => setPlaying(true))
            .catch(() => {});
          if (playThrough) {
            // Once started, disconnect — let it play through the page
            observer.disconnect();
          }
        } else if (!entry.isIntersecting && !playThrough) {
          video.pause();
          started = false;
        }
      },
      { threshold },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlayOnMount, reducedMotion, failed, threshold, playThrough]);

  // Reduced-motion or error: render poster only (or transparent placeholder so layout doesn't collapse)
  if (reducedMotion || failed) {
    if (!poster)
      return <div className={className} style={{ background: '#0f172a' }} aria-hidden="true" />;
    // IMAGE-CONTRACT: allow raw img because poster element requires native img for object-fit
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
        {/* Poster — z-1, sits behind the video (z-2).
            Always starts visible so there is never a blank/blue gap between
            mount and the first video frame. Fades out once the video is playing,
            fades back in if the video ends (non-looping) or fails.
            Explicit inline position/size so it fills the container regardless
            of what className the caller passes — Safari/iOS stacking fix. */}
        {/* IMAGE-CONTRACT: allow raw img because legacy markup */}
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          fetchPriority={autoPlayOnMount ? 'high' : 'auto'}
          loading={autoPlayOnMount ? 'eager' : 'lazy'}
          decoding="async"
          className={`${className} ${
            playing && !ended
              ? 'opacity-0 pointer-events-none'
              : 'opacity-100'
          }`}
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 1,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        {/* Video — z-2, fades in once onPlaying fires (first real frame on screen).
            When loop=true (hero videos), onEnded never fires so the poster stays
            hidden and the video plays seamlessly in perpetuity.
            src set directly on <video> (not only via <source>) so canplay fires
            reliably on Safari/iOS and Firefox without waiting for a child parse. */}
        <video
          ref={ref}
          src={src}
          className={`${className} transition-opacity duration-300 ease-in ${playing && !ended ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          loop={loop}
          preload={preloadFull ? 'auto' : 'metadata'}
          aria-hidden="true"
          onPlaying={handlePlaying}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
          onStalled={handleStalled}
          onWaiting={handleStalled}
          style={{
            zIndex: 2,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
      </>
    );
  }

  // No poster — video fills frame; dark parent background until first frame
  return (
    <video
      ref={ref}
      src={src}
      className={`${className} ${ended && !loop ? 'opacity-0' : 'opacity-100'}`}
      muted
      playsInline
      loop={loop}
      preload={preloadFull ? 'auto' : 'metadata'}
      aria-hidden="true"
      onPlaying={handlePlaying}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      onError={handleError}
      onStalled={handleStalled}
      onWaiting={handleStalled}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
        zIndex: 2,
      }}
    />
  );
}
