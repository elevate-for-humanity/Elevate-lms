'use client';

import HeroVideo from '@/components/marketing/HeroVideo';

/**
 * PageVideoHero — wrapper providing backwards-compatible props for heroMedia.ts config.
 * Maps legacy `size` prop to HeroVideo's below-hero content.
 */

export type HeroSize = 'primary' | 'marketing' | 'compact' | 'full';

export interface PageVideoHeroProps {
  videoSrc: string;
  posterSrc?: string;
  posterAlt?: string;
  size?: HeroSize;
  headline?: string;
  subheadline?: string;
  children?: React.ReactNode;
}

export default function PageVideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  size = 'marketing',
  headline,
  subheadline,
  children,
}: PageVideoHeroProps) {
  return (
    <HeroVideo
      videoSrcDesktop={videoSrc}
      posterImage={posterSrc}
      belowHeroHeadline={headline}
      belowHeroSubheadline={subheadline}
      className={size === 'compact' ? 'max-h-96' : ''}
    >
      {children}
    </HeroVideo>
  );
}
