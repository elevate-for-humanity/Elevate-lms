'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export default function HomeHeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const hasPlayedVoiceover = useRef(false);

  // Autoplay silent video on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try { await video.play(); setIsPlaying(true); } catch { /* poster visible */ }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('loadeddata', play, { once: true });
    return () => video.removeEventListener('loadeddata', play);
  }, []);

  // Play voiceover on first user interaction (scroll, click, touch, or keypress)
  useEffect(() => {
    const audio = voiceoverRef.current;
    if (!audio) return;

    const tryPlay = () => {
      if (hasPlayedVoiceover.current) return;
      hasPlayedVoiceover.current = true;
      audio.play().catch(() => {
        // If still blocked, reset so next gesture can try
        hasPlayedVoiceover.current = false;
      });
    };

    window.addEventListener('scroll', tryPlay, { once: true, passive: true });
    window.addEventListener('click', tryPlay, { once: true, passive: true });
    window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
    window.addEventListener('keydown', tryPlay, { once: true, passive: true });

    return () => {
      window.removeEventListener('scroll', tryPlay);
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <Image src="/images/pages/home-hero-video.jpg" alt="Elevate for Humanity career training" fill priority sizes="100vw" className="object-cover object-center z-0" />
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover object-center z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} loop muted playsInline autoPlay preload="metadata">
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={voiceoverRef} src="/audio/welcome-voiceover.mp3" preload="auto" />
    </div>
  );
}
