"use client";

import React from 'react';

import { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VoiceoverPlayerProps {
  text: string;
  autoPlay?: boolean;
  voiceoverFile?: string; // Path to custom professional voiceover
}

export default function VoiceoverPlayer({
  text,
  autoPlay = false,
  voiceoverFile = '/videos/voiceover.mp3'
}: VoiceoverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices on mount (ready state, no autoplay)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setIsReady(true);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.cancel();
      };
    }
  }, []);

  // REMOVED: Autoplay is blocked by browsers
  // Component is now ready on load, requires user click

  const playVoiceover = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    setHasPlayed(true);

    try {
      // Use ONLY pre-recorded PROFESSIONAL voiceover from repository
      // Available files:
      // - /videos/voiceover.mp3 (default)
      // - /videos/barber-voiceover.mp3 (barber page)
      // - /videos/homepage-voiceover-natural.txt (script)
      if (audioRef.current) {
        audioRef.current.src = voiceoverFile;
        audioRef.current.muted = false; // NOT muted - user triggered
        audioRef.current.loop = false; // NO LOOP - plays once
        await audioRef.current.play().catch(() => {});
      }
    } catch (error) { /* Error handled silently */ 
      // NO robotic fallback - only professional voiceovers
      handleVoiceoverError();
    }
  };

  const handleVoiceoverError = () => {
    // DO NOT USE robotic browser speech
    // Only professional pre-recorded voiceovers allowed
    setIsPlaying(false);

    // Show error message to user
    alert('Professional voiceover file not found. Please add custom voiceover to /public/videos/voiceover.mp3');
  };

  const stopVoiceover = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);

    if (audioRef.current) {
      audioRef.current.muted = newMutedState;
    }

    if (utteranceRef.current && window.speechSynthesis.speaking) {
      utteranceRef.current.volume = newMutedState ? 0 : 1.0;
    }
  };

  return (
    <>
      {/* Control Button - Fixed position */}
      <div className="fixed bottom-6 right-6 z-50 flex gap-2">
        {isPlaying && (
          <button
            onClick={toggleMute}
            className="p-3 bg-white text-black rounded-full shadow-lg hover:bg-slate-100 transition-all border-2 border-slate-200"
            title={isMuted ? "Unmute voiceover" : "Mute voiceover"}
            aria-label={isMuted ? "Unmute voiceover" : "Mute voiceover"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        )}

        {!isPlaying && hasPlayed && (
          <button
            onClick={playVoiceover}
            className="p-3 bg-brand-orange-500 text-white rounded-full shadow-lg hover:bg-brand-orange-600 transition-all"
            title="Replay voiceover"
            aria-label="Replay voiceover"
          >
            <Volume2 size={24} />
          </button>
        )}

        {isPlaying && (
          <button
            onClick={stopVoiceover}
            className="p-3 bg-brand-orange-500 text-white rounded-full shadow-lg hover:bg-brand-orange-600 transition-all"
            title="Stop voiceover"
            aria-label="Stop voiceover"
          >
            <VolumeX size={24} />
          </button>
        )}
      </div>

      {/* Hidden audio element for PROFESSIONAL CUSTOM voiceover ONLY */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          // Only use custom professional voiceover - no robotic fallback
          handleVoiceoverError();
        }}
        preload="none"
        className="hidden"
      />
    </>
  );
}
