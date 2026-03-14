'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';
import { Volume2, VolumeX } from 'lucide-react';

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
  /** @deprecated audioSrc is no longer used — narration is handled by the video track */
  audioSrc?: string;
  size?: HeroSize;
}

/**
 * Full-width video hero.
 * Starts muted (required for autoplay on all browsers).
 * Shows a sound toggle button — clicking unmutes with a user gesture,
 * which satisfies browser autoplay policy.
 */
export default function PageVideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  size = 'marketing',
}: PageVideoHeroProps) {
  const { videoRef, muted, unmute } = useHeroVideo();

  return (
    <section
      className={`relative w-full ${SIZE[size]} overflow-hidden bg-slate-900`}
    >
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

      {/* Sound toggle — only shown while muted */}
      {muted && (
        <button
          onClick={unmute}
          aria-label="Unmute video"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 text-white text-sm font-medium hover:bg-black/70 transition backdrop-blur-sm"
        >
          <VolumeX className="w-4 h-4" />
          <span className="hidden sm:inline">Tap for sound</span>
        </button>
      )}

      {/* Confirmation when unmuted */}
      {!muted && (
        <button
          onClick={() => {
            const el = videoRef.current;
            if (el) { el.muted = true; }
          }}
          aria-label="Mute video"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full bg-black/50 text-white text-sm font-medium hover:bg-black/70 transition backdrop-blur-sm"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      )}
    </section>
  );
}
