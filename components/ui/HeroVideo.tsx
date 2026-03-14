'use client';

import { ReactNode } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface HeroVideoProps {
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: 30 | 40;
  children?: ReactNode;
  className?: string;
}

export function HeroVideo({
  videoSrc,
  posterSrc,
  overlayOpacity = 40,
  children,
  className = '',
}: HeroVideoProps) {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });

  return (
    <section className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        loop
        playsInline
        preload="none"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />
      <div className="relative">{children}</div>
    </section>
  );
}
