'use client';

import { useRef, useEffect } from 'react';

type HeroVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  audioTrack?: string;
};

export default function HeroVideo({
  src,
  poster,
  className,
  audioTrack,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Autoplay with sound on load; fall back to muted if browser blocks it
  useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;

    const play = async () => {
      if (audioTrack && a) {
        v.muted = true;
        try {
          await Promise.all([v.play(), a.play()]);
        } catch {
          v.play().catch(() => {});
        }
      } else {
        v.muted = false;
        v.play().catch(() => {
          v.muted = true;
          v.play().catch(() => {});
        });
      }
    };

    play();
  }, [audioTrack]);

  // Keep audio in sync with video
  useEffect(() => {
    if (!audioTrack) return;
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    const syncAudio = () => {
      if (Math.abs(v.currentTime - a.currentTime) > 0.3) {
        a.currentTime = v.currentTime;
      }
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
  }, [audioTrack]);

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
