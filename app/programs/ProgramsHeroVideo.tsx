'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function ProgramsHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: true });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;
    audio.play().catch(() => {
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
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop playsInline preload="metadata"
        poster="/images/pages/training-cohort.jpg"
      >
        <source src="/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/programs.mp3" preload="metadata" aria-hidden="true" />
    </>
  );
}
