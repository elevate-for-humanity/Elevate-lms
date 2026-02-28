'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedVoiceover = useRef(false);
  const [voPlaying, setVoPlaying] = useState(false);
  const [voFinished, setVoFinished] = useState(false);

  // Video auto-plays muted on scroll into view, pauses when scrolled away.
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
      { threshold: 0.2 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Voiceover ended handler
  useEffect(() => {
    const vo = voiceoverRef.current;
    if (!vo) return;
    const onEnd = () => { setVoPlaying(false); setVoFinished(true); };
    vo.addEventListener('ended', onEnd);
    return () => vo.removeEventListener('ended', onEnd);
  }, []);

  // User taps to start voiceover — required by browser autoplay policy
  const startVoiceover = useCallback(() => {
    const vo = voiceoverRef.current;
    if (!vo || hasStartedVoiceover.current) return;
    hasStartedVoiceover.current = true;
    vo.play().catch(() => {});
    setVoPlaying(true);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        muted
        playsInline
        preload="metadata"
      />

      {voiceoverSrc && (
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="auto" />
      )}

      {/* Voiceover button — tap to listen, plays until complete */}
      {voiceoverSrc && !voFinished && (
        <div className="absolute bottom-4 right-4 z-10">
          {!voPlaying ? (
            <button
              onClick={startVoiceover}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-red-600 hover:bg-brand-red-700 text-white transition-all animate-pulse"
            >
              <Volume2 className="w-5 h-5" />
              <span className="text-sm font-bold hidden sm:inline">Listen</span>
            </button>
          ) : (
            <span className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-red-600 text-white">
              <Volume2 className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-semibold hidden sm:inline">Speaking...</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
