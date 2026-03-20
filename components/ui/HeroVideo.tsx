'use client';

import { ReactNode } from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface HeroVideoProps {
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: 30 | 40;
  children?: ReactNode;
  className?: string;
}

export function HeroVideo({
  videoSrc,
  posterSrc = '/images/og-default.jpg',
  overlayOpacity = 40,
  children,
  className = '',
}: HeroVideoProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className={`absolute inset-0 bg-black/${overlayOpacity}`} />
      <div className="relative">{children}</div>
    </section>
  );
}
