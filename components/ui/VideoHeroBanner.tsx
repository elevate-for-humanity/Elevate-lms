'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';

interface VideoHeroBannerProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt?: string;
}

export default function VideoHeroBanner({ videoSrc, posterSrc, posterAlt }: VideoHeroBannerProps) {
  const { videoRef } = useHeroVideo();

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay loop muted playsInline preload="metadata"
        poster={posterSrc}
        aria-label={posterAlt}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
