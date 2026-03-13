'use client';

import { useEffect, useRef, useState } from 'react';

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
 * Full-width video hero. No text overlay, no gradient.
 * Video autoplays muted on scroll into view (browsers allow muted autoplay).
 * If audioSrc is provided, a "Play narration" button appears — audio only
 * starts on explicit click to satisfy browser autoplay policies.
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
  const [playing, setPlaying] = useState(false);

  // Muted video autoplay on scroll — no user gesture required for muted media
  useEffect(() => {
    const section = sectionRef.current;
    const video   = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  function handleNarration() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {});
      setPlaying(true);
    }
  }

  function handleAudioEnded() {
    setPlaying(false);
  }

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
        <>
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="none"
            onEnded={handleAudioEnded}
            aria-hidden="true"
          />
          <button
            onClick={handleNarration}
            aria-label={playing ? 'Pause narration' : 'Play narration'}
            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>
            {playing ? 'Pause narration' : 'Play narration'}
          </button>
        </>
      )}
    </section>
  );
}
