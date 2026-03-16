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
    
    audioRef.current.muted = false;
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

  // Playing state — branded bottom bar
  if (isPlaying) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Progress bar */}
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-brand-red-600 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="bg-slate-900 border-t border-slate-700">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Soundbars */}
              <div className="flex items-end gap-0.5 h-5 flex-shrink-0">
                <span className="w-1 bg-brand-red-500 rounded-full animate-soundbar1" style={{ height: '60%' }} />
                <span className="w-1 bg-brand-red-500 rounded-full animate-soundbar2" style={{ height: '100%' }} />
                <span className="w-1 bg-brand-red-500 rounded-full animate-soundbar3" style={{ height: '40%' }} />
                <span className="w-1 bg-brand-red-500 rounded-full animate-soundbar1" style={{ height: '80%' }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">Elevate for Humanity</p>
                <p className="text-xs text-slate-400 truncate">Indianapolis workforce training</p>
              </div>
            </div>
            <button
              onClick={stopAudio}
              className="flex-shrink-0 px-4 py-1.5 rounded-full border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white text-xs font-semibold transition-colors"
              aria-label="Stop"
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Play button — brand red, bottom right
  if (showPlayButton && !hasPlayed) {
    return (
      <button
        onClick={playAudio}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Hear our welcome message"
      >
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-brand-red-600 animate-pulse opacity-30" />
          <div className="relative flex items-center gap-2.5 bg-brand-red-600 hover:bg-brand-red-700 text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:scale-105 transition-all duration-200">
            {/* Speaker icon */}
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
            <div className="text-left">
              <span className="text-sm font-bold block leading-tight">Hear Our Story</span>
              <span className="text-xs opacity-80 leading-tight">Elevate for Humanity</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return null;
}
