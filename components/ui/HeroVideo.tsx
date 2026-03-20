'use client';

import { ReactNode } from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface HeroVideoProps {
  videoSrc: string;
  posterSrc?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * HeroVideo — video frame only. No overlay, no text on frame.
 * Place all content (headlines, CTAs) in a sibling section below this component.
 */
export function HeroVideo({
  videoSrc,
  posterSrc = '/images/og-default.jpg',
  className = '',
  children,
}: HeroVideoProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc as `/${string}`}
        className="w-full h-full object-cover"
      />
      {/* children allowed only for micro-controls (sound toggle, play/pause) */}
      {children}
    </section>
  );
}
