'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface ProgramHeroBannerProps {
  videoSrc: string;
  posterImage?: string;
  title?: string;
}

export default function ProgramHeroBanner({ videoSrc, posterImage = '/images/og-default.jpg' }: ProgramHeroBannerProps) {
  return (
    <div className="relative w-full h-full">
      <CanonicalVideo
        src={videoSrc}
        poster={posterImage}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
