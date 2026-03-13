'use client';

import { useEffect, useRef } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export function CareerHero() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: true });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (audioRef.current && !playedRef.current) {
      playedRef.current = true;
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <section className="relative h-[60svh] min-h-[380px] max-h-[640px] overflow-hidden bg-slate-900">
      <video ref={videoRef} autoPlay loop muted playsInline preload="metadata"
        className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/career-services-hero.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/career-services.mp3" preload="metadata" aria-hidden="true" />
    </section>
  );
}
