'use client';

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
}

export default function PageVideoHero({ videoSrc, posterSrc, posterAlt, audioSrc, size = 'marketing' }: PageVideoHeroProps) {
  const { videoRef } = useHeroVideo();

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video
        ref={videoRef}
        autoPlay
        loop
        playsInline
        muted
        preload="auto"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      {audioSrc && <audio id="hero-audio" src={audioSrc} preload="auto" aria-hidden="true" />}
    </section>
  );
}
