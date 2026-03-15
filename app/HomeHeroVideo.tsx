'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;
    audio.play().catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
      const unmute = () => {
        audio.muted = false;
        window.removeEventListener('scroll', unmute, true);
        window.removeEventListener('touchmove', unmute, true);
      };
      window.addEventListener('scroll', unmute, { capture: true, passive: true });
      window.addEventListener('touchmove', unmute, { capture: true, passive: true });
    });
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      {/* Video hidden on mobile — saves bandwidth, avoids autoplay issues */}
      <video
        ref={videoRef}
        loop playsInline preload="auto"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center hidden md:block"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="auto" aria-hidden="true" />
    </div>
  );
}
