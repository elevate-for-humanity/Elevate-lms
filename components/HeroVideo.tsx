'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

export function HeroVideo() {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      >
        <source src="/videos/barber-hero.mp4" type="video/mp4" />
      </video>
      {showUnmuteButton && <UnmuteButton onClick={unmute} />}
    </>
  );
}
