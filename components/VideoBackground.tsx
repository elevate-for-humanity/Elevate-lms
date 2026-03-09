'use client';

import React from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

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
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

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

      {overlay && <div className="absolute inset-0 bg-black/40 z-[1]" />}

      <div className="relative z-10">{children}</div>

      {showUnmuteButton && <UnmuteButton onClick={unmute} />}
    </div>
  );
}
