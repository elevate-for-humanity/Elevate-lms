'use client';

import { useRef, useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
}

/**
 * Video hero banner. Autoplays muted on page load.
 * Same layout on laptop, desktop, and Chromebook — no cutoff.
 */
export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Play immediately on mount
    video.play().catch(() => {});

    // Pause when scrolled off-screen, resume when visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toggleVoiceover = () => {
    const audio = voiceoverRef.current;
    if (!audio) return;

    if (voiceActive) {
      audio.pause();
      setVoiceActive(false);
    } else {
      audio.currentTime = 0;
      audio.play()
        .then(() => setVoiceActive(true))
        .catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
    >
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img
          src={posterImage}
          alt="Program hero banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      {voiceoverSrc && (
        <>
          <audio
            ref={voiceoverRef}
            src={voiceoverSrc}
            preload="auto"
            onEnded={() => setVoiceActive(false)}
          />
          <button
            onClick={toggleVoiceover}
            className={`absolute z-20 bottom-5 right-5 flex items-center gap-2 rounded-full shadow-lg px-5 py-3 transition-all ${
              voiceActive
                ? 'bg-white text-slate-900 hover:bg-slate-100'
                : 'bg-brand-red-600 text-white hover:bg-brand-red-700 animate-pulse'
            }`}
            aria-label={voiceActive ? 'Stop narration' : 'Listen'}
          >
            {voiceActive ? (
              <>
                <Volume2 className="w-5 h-5" />
                <span className="text-sm font-semibold">Playing...</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span className="text-sm font-semibold">Listen</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
