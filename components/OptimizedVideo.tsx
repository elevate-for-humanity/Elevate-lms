'use client';
import { logger } from '@/lib/logger';

import { useEffect, useRef, useState } from 'react';

interface OptimizedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  audioTrack?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
}

export function OptimizedVideo({
  src,
  poster,
  className = '',
  audioTrack,
  autoPlay = true,
  loop = true,
  muted = true,
  playsInline = true,
}: OptimizedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !autoPlay) return;

    const playMedia = async () => {
      try {
        if (audioTrack && audio && !muted) {
          // Play video muted with separate audio track
          video.muted = true;
          await Promise.all([video.play(), audio.play()]);
        } else {
          // Play video - respect muted prop
          video.muted = muted;
          await video.play();
        }
        setIsPlaying(true);
      } catch (error) {
        logger.error('Error:', error);
      }
    };

    const timer = setTimeout(playMedia, 100);
    return () => clearTimeout(timer);
  }, [audioTrack, autoPlay, muted]);

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        loop={loop}
        muted={muted}
        playsInline={playsInline}
      />
      {audioTrack && !muted && (
        <audio ref={audioRef} src={audioTrack} loop={loop} className="hidden" />
      )}
    </div>
  );
}
