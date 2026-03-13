'use client';

import { useEffect, useRef } from 'react';

export type HeroSize = 'primary' | 'program' | 'marketing' | 'support';

const SIZE: Record<HeroSize, string> = {
  primary:   'h-[75svh] min-h-[480px] max-h-[860px]',
  program:   'h-[65svh] min-h-[420px] max-h-[720px]',
  marketing: 'h-[60svh] min-h-[380px] max-h-[640px]',
  support:   'h-[50svh] min-h-[300px] max-h-[520px]',
};

interface PageVideoHeroProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt: string;
  audioSrc?: string;
  size?: HeroSize;
}

/**
 * Full-width video hero. No text, no gradient, no mute button.
 * Video loops muted. Voiceover plays once when section enters viewport.
 */
export default function PageVideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  audioSrc,
  size = 'marketing',
}: PageVideoHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const audioRef   = useRef<HTMLAudioElement>(null);
  const playedRef  = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    const video   = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.muted = true;
          video.play().catch(() => {});
          if (audioSrc && audioRef.current && !playedRef.current) {
            playedRef.current = true;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [audioSrc]);

  return (
    <section
      ref={sectionRef}
      className={`relative w-full ${SIZE[size]} overflow-hidden bg-slate-900`}
    >
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="metadata"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="none" aria-hidden="true" />
      )}
    </section>
  );
}
