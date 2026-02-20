'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try { await video.play(); setIsPlaying(true); } catch { /* poster visible */ }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('loadeddata', play, { once: true });
    return () => video.removeEventListener('loadeddata', play);
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      if (video.paused) video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  return (
    <>
      <Image src="/images/hero-poster.webp" alt="Elevate for Humanity career training" fill priority sizes="100vw" className="object-cover z-0" />
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} loop muted playsInline autoPlay preload="auto">
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      {/* Sound toggle — large and animated when muted to draw attention */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            isMuted
              ? 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
              : 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
          }`}
          aria-label={isMuted ? 'Unmute video' : 'Mute video'}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-5 h-5" />
              <span className="text-sm font-bold">Tap for Sound</span>
            </>
          ) : (
            <>
              <Volume2 className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline">Sound On</span>
            </>
          )}
        </button>
      )}
    </>
  );
}
