'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function HomeHeroVideo() {
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const audio = voiceoverRef.current;
    if (!audio) return;

    const tryPlay = () => {
      if (hasPlayed.current) return;
      hasPlayed.current = true;
      audio.play().catch(() => {
        // Browser still blocked — reset so next gesture retries
        hasPlayed.current = false;
      });
    };

    window.addEventListener('scroll',     tryPlay, { once: true, passive: true });
    window.addEventListener('click',      tryPlay, { once: true, passive: true });
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    window.addEventListener('keydown',    tryPlay, { once: true, passive: true });

    return () => {
      window.removeEventListener('scroll',     tryPlay);
      window.removeEventListener('click',      tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('keydown',    tryPlay);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Poster shown until video loads */}
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      {/* Silent looping video — autoPlay+muted+playsInline is the only
          cross-browser reliable combo (required for iOS autoplay policy) */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover object-center"
        poster="/images/pages/home-hero-video.jpg"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      {/* Voiceover — plays on first user gesture (scroll, click, touch, key) */}
      <audio ref={voiceoverRef} src="/audio/welcome-voiceover.mp3" preload="auto" />
    </div>
  );
}
