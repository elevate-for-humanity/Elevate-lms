'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';

/**
 * Home page hero video — client component so useHeroVideo can run.
 * Autoplays on scroll into view, attempts to unmute immediately.
 * Shows "Tap to unmute" button on mobile/Safari where browser blocks
 * unmuted autoplay.
 */
export default function HomeHeroVideo() {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

  return (
    <>
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

      {showUnmuteButton && (
        <button
          onClick={unmute}
          aria-label="Tap to unmute video"
          className="absolute bottom-20 right-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <span aria-hidden="true">🔇</span>
          Tap to unmute
        </button>
      )}
    </>
  );
}
