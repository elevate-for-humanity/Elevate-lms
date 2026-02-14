'use client';

import { useRef, useState } from 'react';

interface HeroWithVoiceoverProps {
  videoSrc: string;
  audioSrc: string;
  children: React.ReactNode;
}

export function HeroWithVoiceover({
  videoSrc,
  audioSrc,
  children,
}: HeroWithVoiceoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showButton, setShowButton] = useState(true);

  const handlePlaySound = () => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.muted = true;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setShowButton(false);
        })
        .catch(() => {
          // Audio play failed
        });
    }
  };

  return (
    <section className="relative bg-gray-900 py-20 md:py-32">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Voiceover Audio */}
      <audio ref={audioRef} src={audioSrc} preload="none" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        {children}

        {/* Play Sound Button */}
        {showButton && (
          <div className="mt-6">
            <button
              onClick={handlePlaySound}
              className="px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold rounded-lg transition-all"
            >
              🔊 Play with Sound
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
