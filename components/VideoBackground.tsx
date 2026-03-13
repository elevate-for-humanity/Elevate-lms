'use client';

import React from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface VideoBackgroundProps {
  videoUrl: string;
  poster?: string;
  overlay?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function VideoBackground({
  videoUrl,
  poster,
  overlay = true,
  className = '',
  children,
}: VideoBackgroundProps) {
  const { videoRef } = useHeroVideo();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* overlay removed — no dark scrim on video backgrounds */}

      <div className="relative z-10">{children}</div>    </div>
  );
}
