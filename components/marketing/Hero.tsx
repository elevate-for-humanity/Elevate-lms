'use client';

import Link from 'next/link';
import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

export function Hero() {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

  return (
    <section className="relative w-full -mt-[72px]">
      <div className="relative min-h-[100vh] sm:min-h-[70vh] md:min-h-[75vh] w-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/videos/hero-home.mp4" type="video/mp4" />
        </video>
        {showUnmuteButton && <UnmuteButton onClick={unmute} />}
      </div>
    </section>
  );
}
