'use client';

/**
 * Video component that automatically uses R2 CDN URLs when configured.
 * Falls back to local /videos/ path if R2 is not set up.
 */

import { useRef, useState } from 'react';
import { Play } from 'lucide-react';

const R2_URL = process.env.NEXT_PUBLIC_R2_URL;

interface VideoProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  clickToPlay?: boolean;
  onEnded?: () => void;
}

export function getVideoUrl(src: string): string {
  if (!src) return '';
  
  // Already a full URL
  if (src.startsWith('http')) return src;
  
  // Use R2 if configured
  if (R2_URL && src.startsWith('/videos/')) {
    return `${R2_URL}${src}`;
  }
  
  return src;
}

export default function Video({
  src,
  poster,
  className = '',
  autoPlay = false,
  loop = false,
  muted = false,
  controls = true,
  clickToPlay = false,
  onEnded,
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const videoSrc = getVideoUrl(src);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {});
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        poster={poster}
        autoPlay={autoPlay && !clickToPlay}
        loop={loop}
        muted={muted}
        controls={controls && isPlaying}
        playsInline
        preload={autoPlay ? 'metadata' : 'none'}
        onEnded={handleEnded}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {clickToPlay && !isPlaying && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors cursor-pointer"
          aria-label="Play video"
        >
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-brand-blue-600 ml-1" />
          </div>
        </button>
      )}
    </div>
  );
}
