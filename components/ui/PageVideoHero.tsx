'use client';

import { useEffect, useRef } from 'react';
import VoiceoverWithMusic from '@/components/VoiceoverWithMusic';
import { validateHeroVideoElement } from '@/lib/hero-video-audit';

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

// Video frame only. No text, no gradient overlay, no CTAs on the video.
// All page identity content must render below this component.
export default function PageVideoHero({ videoSrc, posterSrc, posterAlt, audioSrc, size = 'marketing' }: PageVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Attempt unmuted autoplay. Fall back to muted if browser blocks it.
    el.muted = false;
    el.volume = 0.8;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
    });

    const result = validateHeroVideoElement(el);
    if (!result.ok) {
      console.error('[PageVideoHero] audit failed:', result.errors);
    }
  }, []);

  return (
    <section className={`relative w-full ${SIZE[size]} overflow-hidden`}>
      <video
        ref={videoRef}
        loop
        playsInline
        preload="auto"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {audioSrc && <VoiceoverWithMusic audioSrc={audioSrc} />}
    </section>
  );
}
