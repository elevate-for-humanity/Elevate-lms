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

  // Play voiceover on scroll-into-view, unmuting on first gesture (mobile safe)
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
            // Mobile blocked — unmute on first gesture
            audio.muted = true;
            audio.play().catch(() => {});
            const unmute = () => {
              audio.muted = false;
              ['click', 'scroll', 'touchstart', 'keydown'].forEach(e =>
                window.removeEventListener(e, unmute, true)
              );
            };
            ['click', 'scroll', 'touchstart', 'keydown'].forEach(e =>
              window.addEventListener(e, unmute, { once: true, capture: true, passive: true } as EventListenerOptions)
            );
          });
        }
      },
      { threshold: 0.3 }
    );

    if (audioRef.current) observer.observe(audioRef.current);
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
          preload="metadata"
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
