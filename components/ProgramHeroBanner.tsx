'use client';

import { useRef, useEffect, useState } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage }: ProgramHeroBannerProps) {
  const { videoRef } = useHeroVideo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!voiceoverSrc || !audioRef.current) return;
    const audio = audioRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !playedRef.current) {
          playedRef.current = true;
          audio.volume = 1;
          audio.muted = false;
          audio.play().catch(() => {
            // Muted fallback, unmute on next scroll
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
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(audio);
    return () => observer.disconnect();
  }, [voiceoverSrc]);

  return (
    <div className="relative w-full h-full bg-black">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          loop
          playsInline
          preload="none"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt="Program hero" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-900" />
      )}
      {voiceoverSrc && (
        <audio ref={audioRef} src={voiceoverSrc} preload="auto" aria-hidden="true" />
      )}
    </div>
  );
}
