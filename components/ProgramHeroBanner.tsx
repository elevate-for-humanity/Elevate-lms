'use client';

import { useRef, useEffect } from 'react';

interface ProgramHeroBannerProps {
  videoSrc: string;
}

export default function ProgramHeroBanner({ videoSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
  }, []);

  return (
    <div className="w-full overflow-hidden bg-black" style={{ maxHeight: '400px' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ aspectRatio: '16/9', maxHeight: '400px' }}
        src={videoSrc}
        muted
        autoPlay
        loop
        playsInline
        preload="metadata"
      />
    </div>
  );
}
