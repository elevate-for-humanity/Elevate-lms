'use client';

import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  // Play/pause video based on scroll visibility
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

  // Auto-start voiceover on page load — plays once, no loop
  useEffect(() => {
    if (!voiceoverSrc) return;
    const voiceover = voiceoverRef.current;
    if (!voiceover) return;
    voiceover.play().then(() => setVoiceActive(true)).catch(() => {});
  }, [voiceoverSrc]);

  const toggleVoiceover = () => {
    const voiceover = voiceoverRef.current;
    if (!voiceover) return;
    if (!voiceActive) {
      voiceover.currentTime = 0;
      voiceover.play().catch(() => {});
      setVoiceActive(true);
    } else {
      voiceover.pause();
      setVoiceActive(false);
    }
  };

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

      {voiceoverSrc && (
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="auto" onEnded={() => setVoiceActive(false)} />
      )}

      {voiceoverSrc && (
        <button
          onClick={toggleVoiceover}
          aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
          className={`absolute z-10 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            voiceActive
              ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
              : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
          }`}
        >
          {voiceActive ? (
            <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></>
          ) : (
            <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Narration</span></>
          )}
        </button>
      )}
    </div>
  );
}
