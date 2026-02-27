'use client';

import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc }: ProgramHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
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
          // Pause voiceover when scrolled away
          const vo = voiceoverRef.current;
          if (vo && !vo.paused) {
            vo.pause();
            setVoiceActive(false);
          }
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
    <div ref={containerRef} className="relative w-full overflow-hidden bg-black" style={{ maxHeight: '480px' }}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ aspectRatio: '16/9', maxHeight: '480px' }}
        src={videoSrc}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
      />

      {voiceoverSrc && (
        <audio ref={voiceoverRef} src={voiceoverSrc} preload="none" onEnded={() => setVoiceActive(false)} />
      )}

      {/* Controls row — bottom right */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        {/* Voiceover toggle */}
        {voiceoverSrc && (
          <button
            onClick={toggleVoiceover}
            aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-sm text-white transition-all ${
              voiceActive
                ? 'bg-brand-red-600 hover:bg-brand-red-700'
                : 'bg-black/50 hover:bg-black/70'
            }`}
          >
            {voiceActive ? (
              <><Mic className="w-4 h-4" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></>
            ) : (
              <><MicOff className="w-4 h-4" /><span className="text-sm font-semibold hidden sm:inline">Narration</span></>
            )}
          </button>
        )}

        {/* Video sound toggle — always visible */}
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
