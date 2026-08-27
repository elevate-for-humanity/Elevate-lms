'use client';

import HeroVideo from '@/components/marketing/HeroVideo';

/**
 * PageVideoHero — wrapper providing backwards-compatible props for heroMedia config.
 * Every size maps to an explicit media-frame height; wrapper max-height hacks are prohibited.
 * The poster is forwarded to HeroVideo and renders while the video buffers and as a fallback.
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

const HEIGHT_BY_SIZE: Record<HeroSize, string> = {
  compact: 'h-[30vh] min-h-[220px] max-h-[360px]',
  marketing: 'h-[clamp(420px,58vh,720px)]',
  primary: 'h-[42vh] min-h-[280px] max-h-[520px]',
  full: 'h-[46vh] min-h-[300px] max-h-[520px]',
};

export default function PageVideoHero({
  videoSrc,
  posterSrc,
  posterAlt: _posterAlt,
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
      heightClassName={HEIGHT_BY_SIZE[size]}
    >
      {children}
    </HeroVideo>
  );
}
