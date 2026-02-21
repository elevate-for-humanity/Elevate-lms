"use client";

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, X, Play } from 'lucide-react';
export function MobileVoiceOver() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Show the player and au after a short delay
      const timer = setTimeout(() => {
        setShowPlayer(true);
        setHasInteracted(true);
        // Au the audio
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            // If au is blocked, show the play button
          });
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setHasInteracted(true);
    }
  };
  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  const handleClose = () => {
    handlePause();
    setShowPlayer(false);
  };
  if (!showPlayer) return null;
  return (
    <>
      {/* Floating Audio Player */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <div className="   rounded-2xl shadow-2xl p-4 max-w-xs border-2 border-white">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <X size={14} className="text-black" />
          </button>
          {/* Content */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Volume2 size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-sm">Welcome to Elevate!</h3>
              <p className="text-white/90 text-xs">Learn about our programs</p>
            </div>
          </div>
          {/* Audio Element */}
          <audio
            ref={audioRef}
            src="/videos/training-providers-video-with-narration.mp4"
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <button
                onClick={handlePlay}
                className="flex-1 bg-white text-brand-orange-600 rounded-lg py-2 px-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors"
              >
                <Play size={16} />
                Play Voice-Over
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 bg-white text-brand-orange-600 rounded-lg py-2 px-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-yellow-300 transition-colors"
              >
                <VolumeX size={16} />
                Pause
              </button>
            )}
            <button
              onClick={toggleMute}
              className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX size={18} className="text-white" />
              ) : (
                <Volume2 size={18} className="text-white" />
              )}
            </button>
          </div>
          {/* Info Text */}
          {!hasInteracted && (
            <p className="text-white/80 text-xs mt-2 text-center">
              👆 Tap to hear about our free training programs
            </p>
          )}
        </div>
      </div>
      {/* Au notification - No option to skip */}
      {isPlaying && !hasInteracted && (
        <div className="fixed top-20 left-4 right-4 z-40 md:hidden">
          <div className="   text-white rounded-xl p-4 shadow-2xl animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-bounce">
                <Volume2 size={20} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">🎧 Voice-Over Playing...</p>
                <p className="text-xs text-white/90">Learn about our free training programs</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
