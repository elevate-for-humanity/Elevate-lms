'use client';

import { useEffect, useRef } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function ApplyHeroVideo() {
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
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop playsInline autoPlay preload="auto"
        poster="/images/pages/apply-hero.jpg"
      >
        <source src="/videos/getting-started-hero.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/apply.mp3" preload="metadata" aria-hidden="true" />
    </>
  );
}
