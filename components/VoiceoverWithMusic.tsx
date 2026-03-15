'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface VoiceoverWithMusicProps {
  audioSrc: string;
  delay?: number;
  volume?: number;
}

export default function VoiceoverWithMusic({ 
  audioSrc, 
  delay = 800,
  volume = 0.85 
}: VoiceoverWithMusicProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const playAudio = useCallback(() => {
    if (!audioRef.current || hasPlayed) return;
    
    audioRef.current.volume = volume;
    audioRef.current.play()
      .then(() => {
        setHasPlayed(true);
        setIsPlaying(true);
        setShowPlayButton(false);
        setIsVisible(true);
        
        progressInterval.current = setInterval(() => {
          if (audioRef.current) {
            const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(pct);
          }
        }, 100);
      })
      .catch(() => {
        setShowPlayButton(true);
        setIsVisible(true);
      });
  }, [hasPlayed, volume]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPlaying(false);
    setIsVisible(false);
    setProgress(0);
  }, []);

  useEffect(() => {
    if (hasPlayed || typeof window === 'undefined') return undefined;

    const audio = new Audio(audioSrc);
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.onended = () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setIsPlaying(false);
      setTimeout(() => setIsVisible(false), 300);
    };

    // Show play button immediately - don't try autoplay (browsers block it)
    setShowPlayButton(true);
    setIsVisible(true);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc, hasPlayed]);

  if (!isVisible && !showPlayButton) return null;

  // Playing state - sleek player bar
  if (isPlaying) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
        {/* Progress bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-brand-blue-500 to-brand-blue-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Player bar */}
        <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Left - Now playing */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue-500 to-brand-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-blue-500/30">
                <div className="flex items-end gap-0.5 h-4">
                  <span className="w-1 bg-white rounded-full animate-soundbar1" />
                  <span className="w-1 bg-white rounded-full animate-soundbar2" />
                  <span className="w-1 bg-white rounded-full animate-soundbar3" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Welcome to Elevate</p>
                <p className="text-xs text-gray-500 truncate">Free career training programs</p>
              </div>
            </div>

            {/* Right - Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={stopAudio}
                className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                aria-label="Stop"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Play button - prominent floating button
  if (showPlayButton && !hasPlayed) {
    return (
      <button
        onClick={playAudio}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Play welcome message"
      >
        <div className="relative">
          {/* Pulse ring - more visible */}
          <div className="absolute -inset-2 rounded-full bg-white animate-ping opacity-30" />
          <div className="absolute -inset-1 rounded-full bg-brand-orange-400 animate-pulse opacity-40" />
          
          {/* Button - orange for visibility */}
          <div className="relative flex items-center gap-3 bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 text-white pl-4 pr-6 py-4 rounded-full shadow-2xl shadow-brand-orange-500/40 hover:shadow-brand-orange-500/50 hover:scale-105 transition-all duration-200 border-2 border-white/20">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="text-base font-bold block">🔊 Listen</span>
              <span className="text-xs opacity-90">Welcome message</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return null;
}
