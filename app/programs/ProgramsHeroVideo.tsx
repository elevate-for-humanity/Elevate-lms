'use client';

import { useEffect, useRef } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function ProgramsHeroVideo() {
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
        loop muted playsInline autoPlay preload="metadata"
        poster="/images/pages/training-cohort.jpg"
      >
        <source src="/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/heroes/programs.mp3" preload="metadata" aria-hidden="true" />
    </>
  );
}
