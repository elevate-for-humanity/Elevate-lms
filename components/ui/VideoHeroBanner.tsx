'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

interface VideoHeroBannerProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt?: string;
}

export default function VideoHeroBanner({ videoSrc, posterSrc }: VideoHeroBannerProps) {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

  return (
    <section className="relative w-full aspect-[16/5] overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {showUnmuteButton && <UnmuteButton onClick={unmute} />}
    </section>
  );
}
