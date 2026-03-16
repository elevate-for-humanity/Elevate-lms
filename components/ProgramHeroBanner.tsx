'use client';

import { useRef, useEffect, useState } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
  // title/subtitle/badge intentionally removed — hero banners are visual only
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage }: ProgramHeroBannerProps) {
  const { videoRef } = useHeroVideo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!voiceoverSrc || !audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;

    audio.play().catch(() => {
      // Browser blocked unmuted autoplay — play muted, unmute on first scroll or touch
      audio.muted = true;
      audio.play().catch(() => {});

      const unmute = () => {
        audio.muted = false;
        window.removeEventListener('scroll', unmute, true);
        window.removeEventListener('touchmove', unmute, true);
      };
      window.addEventListener('scroll', unmute, { capture: true, passive: true });
      window.addEventListener('touchmove', unmute, { capture: true, passive: true });
    });
  }, [voiceoverSrc]);

  return (
    <div className="relative w-full h-full">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          autoPlay loop muted playsInline preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt="Program hero" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-100" />
      )}

      {voiceoverSrc && (
        <audio
          ref={audioRef}
          src={voiceoverSrc}
          preload="auto"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
