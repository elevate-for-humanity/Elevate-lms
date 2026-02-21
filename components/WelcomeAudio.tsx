"use client";

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function WelcomeAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Try to autoplay immediately and repeatedly
    const tryPlay = () => {
      if (audioRef.current) {
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setShowButton(false);
          })
          .catch(() => {
            // Autoplay blocked - show button
            setShowButton(true);
          });
      }
    };

    // Try immediately
    tryPlay();

    // Try again after user interaction
    const handleInteraction = () => {
      tryPlay();
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src="/videos/voiceover.mp3"
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          // Error: $1
          setShowButton(true);
        }}
      />

      {/* Audio Control Button */}
      {showButton && (
        <button
          onClick={toggleAudio}
          className="fixed bottom-6 right-6 z-50 bg-brand-orange-600 text-white p-4 rounded-full shadow-2xl hover:bg-brand-orange-700 transition-all hover:scale-110 animate-pulse"
          aria-label={isPlaying ? 'Pause audio' : 'Play welcome message'}
        >
          {isPlaying ? (
            <VolumeX className="w-6 h-6" />
          ) : (
            <Volume2 className="w-6 h-6" />
          )}
        </button>
      )}
    </>
  );
}
