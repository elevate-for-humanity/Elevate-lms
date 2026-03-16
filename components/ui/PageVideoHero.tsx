'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export type HeroSize = 'primary' | 'program' | 'marketing' | 'support';

const SIZE: Record<HeroSize, string> = {
  primary:   'h-[75vh] min-h-[480px] max-h-[860px]',
  program:   'h-[65vh] min-h-[420px] max-h-[720px]',
  marketing: 'h-[60vh] min-h-[380px] max-h-[640px]',
  support:   'h-[50vh] min-h-[300px] max-h-[520px]',
};

interface PageVideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt: string;
  audioSrc?: string;
  size?: HeroSize;
  // title/subtitle/badge intentionally removed — hero banners are visual only
}

export default function PageVideoHero({ videoSrc, posterSrc, posterAlt, audioSrc, size = 'marketing' }: PageVideoHeroProps) {
  const { videoRef } = useHeroVideo();
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!audioSrc || !audioRef.current || playedRef.current) return;
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
  }, [audioSrc]);

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video ref={videoRef} autoPlay loop playsInline muted preload="auto"
        poster={posterSrc} aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover">
        <source src={videoSrc} type="video/mp4" />
      </video>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" aria-hidden="true" />
      )}
    </section>
  );
}
