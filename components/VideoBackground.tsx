'use client';

import React from 'react';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface VideoBackgroundProps {
  videoUrl: string;
  poster?: string;
  className?: string;
  children?: React.ReactNode;
}

export function VideoBackground({
  videoUrl,
  poster = '/images/og-default.jpg',
  className = '',
  children,
}: VideoBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <CanonicalVideo
        src={videoUrl}
        poster={poster}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
