'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';

/**
 * Home page hero video — client component so useHeroVideo can run.
 * Autoplays on scroll into view, attempts to unmute immediately.
 * Shows "Tap to unmute" button on mobile/Safari where browser blocks
 * unmuted autoplay.
 */
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
