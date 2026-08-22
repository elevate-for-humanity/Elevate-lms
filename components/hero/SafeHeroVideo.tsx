'use client';

import { useEffect, useRef, useState } from 'react';

interface SafeHeroVideoProps {
  src: string;
  poster: string;
  className?: string;
  ariaLabel?: string;
}

type NetworkInformationLike = {
  saveData?: boolean;
  effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
};

function shouldAvoidAutoplay(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const constrainedNetwork =
    connection?.saveData === true ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g';

  return reducedMotion || constrainedNetwork;
}

/**
 * Shared hero-video surface.
 *
 * The poster is physically mounted behind the video layer, remains visible
 * until playback actually starts, and stays available as the fallback if the
 * video cannot load or autoplay. Hero videos play once.
 *
 * On Save-Data, 2G/slow-2G, or reduced-motion devices, the poster is used
 * instead of downloading/playing the hero video.
 */
export function SafeHeroVideo({
  src,
  poster,
  className = '',
  ariaLabel = 'Hero video',
}: SafeHeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [avoidAutoplay, setAvoidAutoplay] = useState(false);

  useEffect(() => {
    const updateNetworkPolicy = () => setAvoidAutoplay(shouldAvoidAutoplay());
    updateNetworkPolicy();

    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    connection?.addEventListener?.('change', updateNetworkPolicy);
    motion.addEventListener('change', updateNetworkPolicy);

    return () => {
      connection?.removeEventListener?.('change', updateNetworkPolicy);
      motion.removeEventListener('change', updateNetworkPolicy);
    };
  }, []);

  useEffect(() => {
    setIsPlaying(false);
    setHasFailed(false);

    const video = videoRef.current;
    if (!video || avoidAutoplay) {
      video?.pause();
      return;
    }

    video.muted = true;
    video.loop = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Autoplay can be blocked. Keep the mounted poster visible underneath.
    });

    return () => video.pause();
  }, [src, avoidAutoplay]);

  return (
    <>
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={`${className} z-0`}
        decoding="async"
        fetchPriority="high"
      />
      {!hasFailed && !avoidAutoplay ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="metadata"
          poster={poster}
          aria-label={ariaLabel}
          onCanPlay={() => {
            void videoRef.current?.play().catch(() => {
              // Keep the poster visible when browser policy blocks playback.
            });
          }}
          onPlaying={() => setIsPlaying(true)}
          onError={() => {
            setIsPlaying(false);
            setHasFailed(true);
          }}
          className={`${className} z-10 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}
    </>
  );
}

export default SafeHeroVideo;
