'use client';

import { useRef, useState, useEffect } from 'react';

interface HeroVideoWithVoiceoverProps {
  videoSrc: string;
  posterSrc?: string;
  voiceoverSrc?: string;
  children: React.ReactNode;
}

export default function HeroVideoWithVoiceover({
  videoSrc,
  posterSrc,
  voiceoverSrc,
  children,
}: HeroVideoWithVoiceoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showButton, setShowButton] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Auto-play video muted
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked
      });
    }
  }, []);

  const handlePlaySound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setShowButton(false);
          setIsPlaying(true);
        })
        .catch(() => {
          // Audio play failed
        });
    }
  };

  return (
    <section className="relative bg-gray-900">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Voiceover Audio */}
      {voiceoverSrc && <audio ref={audioRef} src={voiceoverSrc} preload="none" />}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10">
        {children}

        {/* Play Sound Button */}
        {voiceoverSrc && showButton && (
          <button
            onClick={handlePlaySound}
            className="fixed bottom-6 right-6 z-50 bg-white/90 hover:bg-white text-gray-900 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            Play Audio Guide
          </button>
        )}
      </div>
    </section>
  );
}
