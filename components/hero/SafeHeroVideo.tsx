'use client';

import { useEffect, useRef, useState } from 'react';

interface SafeHeroVideoProps {
  src: string;
  poster: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Shared hero-video surface.
 *
 * The poster stays visible until playback actually starts, and remains as the
 * fallback if the video cannot load or autoplay. Hero videos play once.
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

  useEffect(() => {
    setIsPlaying(false);
    setHasFailed(false);

    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.loop = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Autoplay can be blocked. Keep the poster visible as the safe fallback.
    });

    return () => video.pause();
  }, [src]);

  return (
    <>
      <img
        src={poster}
        alt=""
        aria-hidden="true"
        className={className}
      />
      {!hasFailed ? (
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
          className={`${className} transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : null}
    </>
  );
}

export default SafeHeroVideo;
