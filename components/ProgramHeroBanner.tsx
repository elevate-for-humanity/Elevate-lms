'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface ProgramHeroBannerProps {
  videoSrc: string;
  posterImage?: string;
  title?: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({ videoSrc, posterImage = '/images/og-default.jpg' }: ProgramHeroBannerProps) {
  return (
    <div className="relative w-full" style={{ aspectRatio: '16/9', maxHeight: '560px' }}>
      <CanonicalVideo
        src={videoSrc}
        poster={posterImage}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlayOnMount
        preloadFull
        playThrough
      />
    </div>
  );
}
