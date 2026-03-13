'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';

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
  /** @deprecated audioSrc is no longer used — narration is handled by the video track */
  audioSrc?: string;
  size?: HeroSize;
}

/**
 * Full-width video hero. No text overlay, no gradient.
 * Autoplays on scroll into view via useHeroVideo. Attempts to unmute
 * immediately after play — succeeds on desktop; shows a "Tap to unmute"
 * button on mobile/Safari where browser policy blocks unmuted autoplay.
 */
export default function PageVideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  size = 'marketing',
}: PageVideoHeroProps) {
  const { videoRef } = useHeroVideo();

  return (
    <section
      className={`relative w-full ${SIZE[size]} overflow-hidden bg-slate-900`}
    >
      <video
        ref={videoRef}
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </section>
  );
}
