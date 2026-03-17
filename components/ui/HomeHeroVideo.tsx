'use client';

import { useHeroVideo } from '@/hooks/useHeroVideo';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const { videoRef, muted, unmute } = useHeroVideo();

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

      {/* Sound toggle — bottom-right corner of hero */}
      <button
        onClick={unmute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-full bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
      >
        {muted ? (
          <>
            <VolumeX className="w-4 h-4" />
            <span>Sound off</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4" />
            <span>Sound on</span>
          </>
        )}
      </button>
    </>
  );
}
