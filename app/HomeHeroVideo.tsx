'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {});
    // Auto-play voiceover once on load
    if (audioRef.current && !playedRef.current) {
      playedRef.current = true;
      audioRef.current.volume = 1;
      audioRef.current.play().catch(() => {});
    }
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
        autoPlay muted loop playsInline preload="metadata"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover object-center"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={audioRef} src="/audio/welcome-voiceover.mp3" preload="metadata" aria-hidden="true" />
    </div>
  );
}
