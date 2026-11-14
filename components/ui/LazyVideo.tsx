'use client';

import { useState } from 'react';
import UltraVideoPlayer from '@/components/video/UltraVideoPlayer';

export interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export default function LazyVideo({
  src,
  poster,
  className = '',
  autoPlay = false,
  loop = false,
  muted = true,
  controls = true,
}: LazyVideoProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!shouldLoad && poster && (
        <div
          className="absolute inset-0 cursor-pointer"
          style={{ backgroundImage: `url(${poster})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          onClick={() => setShouldLoad(true)}
        />
      )}
      {shouldLoad && (
        <UltraVideoPlayer
          src={src}
          poster={poster}
          autoPlayOnMount={autoPlay}
          loop={loop}
          controls={controls}
        />
      )}
    </div>
  );
}
