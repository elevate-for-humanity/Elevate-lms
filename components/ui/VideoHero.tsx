'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface VideoHeroProps {
  /** Path to the mp4 video file (e.g. "/videos/barber-hero-final.mp4") */
  videoSrc: string;
  /** Fallback poster image shown before video loads */
  posterSrc: string;
  /** Alt text for the poster image */
  posterAlt: string;
  /** Height class (default: "h-[50vh] md:h-[60vh]") */
  heightClass?: string;
}

/**
 * Full-width video hero banner. No text overlay.
 * Autoplays muted on scroll (IntersectionObserver).
 * Falls back to poster image if video can't play.
 */
export default function VideoHero({
  videoSrc,
  posterSrc,
  posterAlt,
  heightClass = 'h-[50vh] md:h-[60vh]',
}: VideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Autoplay when the hero scrolls into view
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${heightClass}`}>
      <Image
        src={posterSrc}
        alt={posterAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${
          isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        loop
        muted
        playsInline
        preload="metadata"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
