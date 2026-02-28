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
  const [isMuted, setIsMuted] = useState(true);
  const hasPlayedVoiceover = useRef(false);

  // Play video on scroll into view, pause when scrolled away.
  // Voiceover starts on first scroll-in and plays until complete (does not pause on scroll-away).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        const vo = voiceoverRef.current;
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {});
          if (vo && !hasPlayedVoiceover.current) {
            hasPlayedVoiceover.current = true;
            vo.play().catch(() => {});
          }
        } else {
          video.pause();
          // Voiceover keeps playing until complete — do not pause it
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

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
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="none" />
      )}

      {/* Video sound toggle */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-sm text-white transition-all ${
            isMuted
              ? 'bg-black/50 hover:bg-black/70'
              : 'bg-brand-blue-600 hover:bg-brand-blue-700'
          }`}
        >
          {isMuted ? (
            <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold hidden sm:inline">Tap for Sound</span></>
          ) : (
            <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Sound On</span></>
          )}
        </button>
      </div>
    </div>
  );
}
