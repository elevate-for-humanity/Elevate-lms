'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoHeroBannerProps {
  videoSrc: string;
  posterSrc: string;
  posterAlt?: string;
}

export default function VideoHeroBanner({ videoSrc, posterSrc, posterAlt = 'Hero banner' }: VideoHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasAutoPlayed = useRef(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!video || !section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            // Attempt unmuted autoplay; fall back to muted if browser blocks it
            video.muted = false;
            video.play().catch(() => {
              video.muted = true;
              setMuted(true);
              video.play().catch(() => {});
            });
          } else {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <section ref={sectionRef} className="relative w-full aspect-[16/5] overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoSrc}
        loop
        playsInline
        preload="metadata"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-full transition-colors"
        aria-label={muted ? 'Unmute video' : 'Mute video'}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </section>
  );
}
