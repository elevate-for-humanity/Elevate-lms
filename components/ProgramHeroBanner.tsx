'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const STORAGE_KEY = 'elevate-hero-sound';

interface ProgramHeroBannerProps {
  videoSrc: string;
}

export default function ProgramHeroBanner({ videoSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true); // always start muted (autoplay-safe)
  const [hasInteracted, setHasInteracted] = useState(false);

  // On mount, check if user previously opted in to sound
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'on') {
        // User previously enabled sound — still start muted for autoplay,
        // but mark as interacted so the "Tap for sound" label is hidden
        setHasInteracted(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Play/pause based on scroll visibility
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Sync muted state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  const toggleMute = useCallback(() => {
    setHasInteracted(true);
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'off' : 'on');
      } catch {
        // localStorage unavailable
      }
      return next;
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden bg-black" style={{ maxHeight: '400px' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ aspectRatio: '16/9', maxHeight: '400px' }}
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
      />

      {/* Sound control */}
      <button
        onClick={toggleMute}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white px-4 py-3 rounded-full transition-all backdrop-blur-sm"
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        {muted && !hasInteracted && (
          <span className="text-sm font-medium">Tap for sound</span>
        )}
      </button>
    </div>
  );
}
