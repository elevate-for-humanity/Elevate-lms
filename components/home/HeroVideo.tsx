'use client';

import React from 'react';

import { useRef, useState, useEffect } from 'react';

type HeroVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  autoplay?: boolean;
  audioTrack?: string;
};

export default function HeroVideo({
  src,
  poster,
  className,
  autoplay = false,
  audioTrack,
}: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  // Attempt autoplay on mount
  useEffect(() => {
    if (!autoplay) return;

    const attemptAutoplay = async () => {
      const v = videoRef.current;
      if (!v) return;

      try {
        // Try with sound first
        v.muted = false;
        await v.play();
        setStarted(true);
        setUserInteracted(true);
      } catch (error) {
        // If blocked, try muted autoplay
        try {
          v.muted = true;
          await v.play();
          setStarted(true);
        } catch (error) {
          // Autoplay blocked completely, show play button
        }
      }
    };

    // Small delay to ensure video is loaded
    const timer = setTimeout(attemptAutoplay, 100);
    return () => clearTimeout(timer);
  }, [autoplay]);

  const playWithSound = async () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v) return;
    try {
      if (audioTrack && a) {
        // If we have a separate audio track, play it synced with video
        v.muted = true; // Mute video to use separate audio
        await Promise.all([v.play(), a.play()]);
      } else {
        v.muted = false;
        await v.play();
      }
      setStarted(true);
      setUserInteracted(true);
    } catch (error) {
      setStarted(true);
      setUserInteracted(true);
    }
  };

  // Sync audio with video
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

    const handlePause = () => {
      a.pause();
    };
    const handlePlay = () => {
      a.play().catch(() => {
        // Ignore play errors (e.g., if user hasn't interacted yet)
      });
    };

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
        preload="none"
        playsInline
        loop
        controls={started}
        className="w-full rounded-2xl shadow-sm border border-zinc-200 bg-black"
      />
      {audioTrack && (
        <audio
          ref={audioRef}
          src={audioTrack}
          preload="none"
          loop
          className="hidden"
        />
      )}

      {!started && (
        <button
          type="button"
          onClick={playWithSound}
          className="absolute inset-0 m-auto h-14 w-56 rounded-full bg-white/95 hover:bg-white text-zinc-900 font-extrabold shadow-md border border-zinc-200 transition-all hover:scale-105"
          aria-label="Play video with sound"
        >
          ▶ Play with Sound
        </button>
      )}

      {started && !userInteracted && (
        <button
          type="button"
          onClick={playWithSound}
          className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-white/95 hover:bg-white text-zinc-900 font-bold shadow-md border border-zinc-200 transition-all text-sm"
          aria-label="Unmute video"
        >
          🔇 Tap for Sound
        </button>
      )}
    </div>
  );
}
