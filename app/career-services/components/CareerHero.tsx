'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export function CareerHero() {
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
    <section className="relative h-[60svh] min-h-[380px] max-h-[640px] overflow-hidden bg-white">
      <video ref={videoRef} loop playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/career-services-hero.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/career-services.mp3" preload="metadata" aria-hidden="true" />
    </section>
  );
}
