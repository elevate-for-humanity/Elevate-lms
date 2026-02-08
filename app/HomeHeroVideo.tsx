'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const R2_URL = process.env.NEXT_PUBLIC_R2_URL;

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoSrc = R2_URL ? `${R2_URL}/videos/hero-home-fast.mp4` : '/videos/hero-home-fast.mp4';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        // Autoplay blocked - poster image already visible
      }
    };

    playVideo();
    
    const handleInteraction = () => {
      if (!isPlaying) {
        playVideo();
      }
    };

    video.addEventListener('loadeddata', playVideo);
    video.addEventListener('canplay', playVideo);
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('scroll', handleInteraction, { once: true });
    
    const timeout1 = setTimeout(playVideo, 100);
    const timeout2 = setTimeout(playVideo, 500);
    
    return () => {
      video.removeEventListener('loadeddata', playVideo);
      video.removeEventListener('canplay', playVideo);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('scroll', handleInteraction);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [isPlaying]);

  return (
    <>
      {/* Priority poster image for fast LCP */}
      <Image
        src="/images/hero-poster.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
        aria-hidden="true"
      />
      {/* Video on top - loads after poster */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        autoPlay
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </>
  );
}
