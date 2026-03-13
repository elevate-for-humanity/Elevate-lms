'use client';

import { useRef, useEffect, useState } from 'react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
}

/**
 * Video hero banner for program pages.
 * Video autoplays muted (browser requirement for autoplay).
 * Voiceover plays with sound on scroll-into-view after any user interaction.
 * If the browser blocks unmuted audio, a click-to-unmute button appears.
 */
export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const playedRef = useRef(false);
  const interactedRef = useRef(false);

  // Track any user interaction — browsers allow unmuted audio after this
  useEffect(() => {
    const onInteract = () => { interactedRef.current = true; };
    window.addEventListener('scroll', onInteract, { once: true, passive: true });
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('scroll', onInteract);
      window.removeEventListener('click', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Start muted — required for autoplay
    video.muted = true;
    video.play().catch(() => {});

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          // Play voiceover with sound once user has interacted
          if (voiceoverSrc && audioRef.current && !playedRef.current) {
            playedRef.current = true;
            const audio = audioRef.current;
            audio.volume = 1;
            audio.muted = false;
            audio.play().catch(() => {
              // Browser blocked unmuted audio — show unmute button
              setAudioBlocked(true);
            });
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
        <audio ref={audioRef} src={voiceoverSrc} preload="auto" aria-hidden="true" />
      )}
      {audioBlocked && (
        <button
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.muted = false;
            audio.play().catch(() => {});
            setAudioBlocked(false);
          }}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
          aria-label="Play audio"
        >
          🔊 Tap to hear
        </button>
      )}
    </div>
  );
}
