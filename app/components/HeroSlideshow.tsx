"use client";

import React from 'react';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function HeroSlideshow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    // Start muted for autoplay to work, user can unmute
    if (videoRef.current) {
      videoRef.current.muted = true;
      setIsMuted(true);
      videoRef.current.loop = false; // NO LOOPING

      // Stop when video ends
      videoRef.current.addEventListener('ended', () => {
        setHasEnded(true);
      });

      videoRef.current.play().catch((error) => {
      });
    }
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        preload="none"
        poster="/images/heroes/hero-federal-funding.jpg"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          filter: 'brightness(1.15) contrast(1.08) saturate(1.12)'
        }}
      >
        <source src="/videos/hero-home.mp4" type="video/mp4" />
      </video>

      {/* Audio control button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-8 right-8 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-105"
        aria-label={isMuted ? 'Unmute video' : 'Mute video'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-black" />
        ) : (
          <Volume2 className="w-5 h-5 text-black" />
        )}
      </button>
    </div>
  );
}
