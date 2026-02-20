'use client';

import { useEffect, useRef, useState } from 'react';

export default function ApplyHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try { await video.play(); setIsPlaying(true); } catch { /* poster visible */ }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('canplay', play, { once: true });
    return () => video.removeEventListener('canplay', play);
  }, []);

  // hero-home-fast.mp4 has no audio track — no sound controls needed
  return (
    <video
      ref={videoRef}
      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
      poster="/hero-images/programs-hero.jpg"
      loop
      muted
      playsInline
      autoPlay
      preload="auto"
    >
      <source src="/videos/hero-home-fast.mp4" type="video/mp4" />
    </video>
  );
}
