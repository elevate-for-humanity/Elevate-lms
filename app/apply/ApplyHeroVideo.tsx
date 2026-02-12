'use client';

import { useEffect, useRef } from 'react';

export default function ApplyHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
      } catch {
        // Autoplay blocked — native poster stays visible
      }
    };

    video.addEventListener('canplay', playVideo, { once: true });
    playVideo();

    const handleInteraction = () => playVideo();
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('scroll', handleInteraction, { once: true });

    return () => {
      video.removeEventListener('canplay', playVideo);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 w-full h-full object-cover"
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
