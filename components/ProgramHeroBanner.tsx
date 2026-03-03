'use client';

import { useRef, useEffect, useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

/**
 * Video hero banner. Video autoplays muted.
 * Voiceover requires user click (browser autoplay policy blocks
 * audio without a user gesture — scroll events don't count).
 */
export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  // Video: autoplay muted, pause when off-screen
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
    <div ref={containerRef} className="relative w-full h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        src={videoSrc}
        muted
        loop
        playsInline
        preload="metadata"
      />

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
