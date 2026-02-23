'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';

export default function HomeHeroVideo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const hasPlayedRef = useRef(false);
  const userInteractedRef = useRef(false);

  // Track any user interaction so browser unlocks audio playback
  useEffect(() => {
    const mark = () => { userInteractedRef.current = true; };
    const events = ['click', 'touchstart', 'scroll', 'keydown'] as const;
    events.forEach(e => window.addEventListener(e, mark, { once: true, passive: true }));
    return () => { events.forEach(e => window.removeEventListener(e, mark)); };
  }, []);

  // Autoplay silent video
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

  const playVoiceover = useCallback(() => {
    const audio = voiceoverRef.current;
    if (!audio || hasPlayedRef.current) return;
    hasPlayedRef.current = true;
    audio.currentTime = 0;
    audio.play()
      .then(() => setVoiceActive(true))
      .catch(() => {
        // Browser blocked — reset so manual tap still works
        hasPlayedRef.current = false;
      });
  }, []);

  // Trigger voiceover when user scrolls past the hero section
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !hasPlayedRef.current) {
          playVoiceover();
        }
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playVoiceover]);

  const toggleVoiceover = () => {
    const audio = voiceoverRef.current;
    if (!audio) return;
    if (!voiceActive) {
      audio.currentTime = 0;
      audio.play().then(() => {
        setVoiceActive(true);
        hasPlayedRef.current = true;
      }).catch(() => {});
    } else {
      audio.pause();
      setVoiceActive(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Image src="/images/hero-poster.webp" alt="Elevate for Humanity career training" fill priority sizes="100vw" className="object-cover z-0" />
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} loop muted playsInline autoPlay preload="metadata">
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      <audio ref={voiceoverRef} src="/audio/welcome-voiceover.mp3" preload="auto" onEnded={() => setVoiceActive(false)} />

      {isPlaying && (
        <button
          onClick={toggleVoiceover}
          className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            voiceActive
              ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
              : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
          }`}
          aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
        >
          {voiceActive ? (
            <>
              <span className="text-lg leading-none" aria-hidden="true">&#x1F50A;</span>
              <span className="text-sm font-semibold hidden sm:inline">Narration On</span>
            </>
          ) : (
            <>
              <span className="text-lg leading-none" aria-hidden="true">&#x1F507;</span>
              <span className="text-sm font-bold">Tap for Narration</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
