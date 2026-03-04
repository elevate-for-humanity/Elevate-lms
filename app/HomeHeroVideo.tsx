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

  // Play voiceover when hero scrolls into view
  useEffect(() => {
    const container = containerRef.current;
    const audio = voiceoverRef.current;
    if (!container || !audio) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasPlayedVoiceover.current) {
          hasPlayedVoiceover.current = true;
          audio.play().catch(() => {
            // Browser blocked autoplay — try on next user gesture
            hasPlayedVoiceover.current = false;
            const tryPlay = () => {
              if (!hasPlayedVoiceover.current) {
                hasPlayedVoiceover.current = true;
                audio.play().catch(() => {});
              }
            };
            window.addEventListener('click', tryPlay, { once: true, passive: true });
            window.addEventListener('touchstart', tryPlay, { once: true, passive: true });
            window.addEventListener('scroll', tryPlay, { once: true, passive: true });
          });
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <Image src="/images/hero-poster.webp" alt="Elevate for Humanity career training" fill priority sizes="100vw" className="object-cover object-center z-0" />
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover object-center z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} loop muted playsInline autoPlay preload="metadata">
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio ref={voiceoverRef} src="/audio/welcome-voiceover.mp3" preload="auto" />
    </div>
  );
}
