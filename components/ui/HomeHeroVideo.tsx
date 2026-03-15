'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function HomeHeroVideo() {
  const { videoRef } = useHeroVideo();

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
