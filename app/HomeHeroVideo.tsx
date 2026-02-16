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

    // Use loadeddata instead of canplay — fires as soon as first frame is ready
    video.addEventListener('loadeddata', playVideo, { once: true });

    // Also try immediately in case already loaded
    if (video.readyState >= 2) playVideo();

    return () => {
      video.removeEventListener('loadeddata', playVideo);
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
        preload="metadata"
      >
        <source src="/videos/hero-home-fast.mp4" type="video/mp4" />
      </video>
    </>
  );
}
