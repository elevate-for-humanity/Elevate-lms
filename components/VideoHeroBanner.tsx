'use client';

import CanonicalVideo from '@/components/video/CanonicalVideo';

interface VideoHeroBannerProps {
  videoSrc?: string;
  posterSrc?: string;
  className?: string;
}

export function VideoHeroBanner({
  videoSrc = '',
  posterSrc = '/images/og-default.jpg',
  className = '',
}: VideoHeroBannerProps) {
  if (!videoSrc) return null;
  return (
    <CanonicalVideo
      src={videoSrc}
      poster={posterSrc}
      className={className || 'absolute inset-0 w-full h-full object-cover'}
    />
  );
}
