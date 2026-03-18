'use client';

import { useEffect, useRef } from 'react';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Try unmuted first. Browsers that block unmuted autoplay fall back to muted.
    el.muted = false;
    el.volume = 0.8;
    el.play().catch(() => {
      el.muted = true;
      el.play().catch(() => {});
    });
  }, []);

  return (
    <video
      ref={videoRef}
      loop
      playsInline
      preload="metadata"
      poster="/images/pages/home-hero-video.jpg"
      aria-label="Elevate for Humanity career training"
      className="absolute inset-0 w-full h-full object-cover object-center"
    >
      <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
    </video>
  );
}
