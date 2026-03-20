'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface VideoHeroBannerProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt?: string;
}

export default function VideoHeroBanner({ videoSrc, posterSrc }: VideoHeroBannerProps) {
  return (
    <div className="absolute inset-0 w-full h-full">
      <CanonicalVideo
        src={videoSrc}
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
