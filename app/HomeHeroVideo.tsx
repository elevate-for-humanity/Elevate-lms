'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked - poster image stays visible
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
    <>
      <Image
        src="/images/hero-poster.jpg"
        alt="Elevate for Humanity career training"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        autoPlay
        preload="auto"
      >
        <source src="/videos/hero-home-fast.mp4" type="video/mp4" />
      </video>
    </>
  );
}
