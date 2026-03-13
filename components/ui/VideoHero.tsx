'use client';

import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface VideoHeroProps {
  /** Path to the mp4 video file (e.g. "/videos/barber-hero-final.mp4") */
  videoSrc: string;
  /** Fallback poster image shown before video loads */
  posterSrc: string;
  /** Alt text for the poster image */
  posterAlt: string;
  /** Height class (default: "h-[50vh] md:h-[60vh]") */
  heightClass?: string;
}

/**
 * Full-width video hero banner. No text overlay.
 * Autoplays on scroll via useHeroVideo. Attempts to unmute immediately —
 * succeeds on desktop; shows "Tap to unmute" on mobile/Safari.
 * Falls back to poster image if video can't play.
 */
export default function VideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  heightClass = 'h-[50vh] md:h-[60vh]',
}: VideoHeroProps) {
  const { videoRef } = useHeroVideo();

  return (
    <div className={`relative w-full overflow-hidden ${heightClass}`}>
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        loop
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
