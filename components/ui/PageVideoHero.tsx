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
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

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

      {showUnmuteButton && (
        <button
          onClick={unmute}
          aria-label="Tap to unmute video"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">🔇</span>
          Tap to unmute
        </button>
      )}
    </section>
  );
}
