'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function ApplyHeroVideo() {
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
        loop playsInline preload="auto"
        poster="/images/pages/apply-hero.jpg"
      >
        <source src="/videos/getting-started-hero.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/apply.mp3" preload="metadata" aria-hidden="true" />
    </>
  );
}
