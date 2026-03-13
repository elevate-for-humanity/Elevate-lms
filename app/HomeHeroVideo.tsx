'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    // Play voiceover on first user interaction (scroll or click)
    const tryAudio = () => {
      if (playedRef.current || !audioRef.current) return;
      playedRef.current = true;
      const audio = audioRef.current;
      audio.muted = false;
      audio.volume = 1;
      audio.play().catch(() => setAudioBlocked(true));
    };
    window.addEventListener('scroll', tryAudio, { once: true, passive: true });
    window.addEventListener('click', tryAudio, { once: true });
    return () => {
      window.removeEventListener('scroll', tryAudio);
      window.removeEventListener('click', tryAudio);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      <video
        ref={videoRef}
        loop playsInline preload="auto"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="auto" aria-hidden="true" />
      {audioBlocked && (
        <button
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.muted = false;
            audio.play().catch(() => {});
            setAudioBlocked(false);
          }}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          aria-label="Play audio"
        >
          🔊 Tap to hear
        </button>
      )}
    </div>
  );
}
