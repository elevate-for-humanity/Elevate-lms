'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

type HeroVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  audioTrack?: string;
};

export default function HeroVideo({ src, poster, className, audioTrack }: HeroVideoProps) {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync separate audio track with video play/pause/seek
  useEffect(() => {
    if (!audioTrack) return;
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    const syncAudio = () => {
      if (Math.abs(v.currentTime - a.currentTime) > 0.3) a.currentTime = v.currentTime;
    };
    const handlePause = () => a.pause();
    const handlePlay = () => a.play().catch(() => {});

    v.addEventListener('timeupdate', syncAudio);
    v.addEventListener('pause', handlePause);
    v.addEventListener('play', handlePlay);
    return () => {
      v.removeEventListener('timeupdate', syncAudio);
      v.removeEventListener('pause', handlePause);
      v.removeEventListener('play', handlePlay);
    };
  }, [audioTrack, videoRef]);

  return (
    <div className={`relative w-full ${className ?? ''}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="auto"
        playsInline
        loop
        className="w-full rounded-2xl shadow-sm border border-zinc-200 bg-black"
      />
      {audioTrack && (
        <audio ref={audioRef} src={audioTrack} preload="auto" loop className="hidden" />
      )}
    </div>
  );
}
