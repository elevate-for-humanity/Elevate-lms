'use client';

import { useRef, useEffect, useState } from 'react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
}

/**
 * Video hero banner for program pages.
 * Autoplays muted on scroll. Voiceover plays once automatically — no controls.
 */
export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const playedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    video.play().catch(() => {});

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          if (voiceoverSrc && audioRef.current && !playedRef.current) {
            playedRef.current = true;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [voiceoverSrc]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          autoPlay muted loop playsInline preload="metadata"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt="Program hero" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-900" />
      )}
      {voiceoverSrc && (
        <audio ref={audioRef} src={voiceoverSrc} preload="metadata" aria-hidden="true" />
      )}
    </div>
  );
}
