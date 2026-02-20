'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const scrollTriggered = useRef(false);

  // Autoplay video muted on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const play = async () => {
      video.muted = true;
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked — poster stays
      }
    };

    video.addEventListener('loadeddata', play, { once: true });
    if (video.readyState >= 2) play();

    return () => {
      video.removeEventListener('loadeddata', play);
    };
  }, []);

  // Play voiceover MP3 on first scroll
  useEffect(() => {
    const onScroll = () => {
      if (scrollTriggered.current) return;
      scrollTriggered.current = true;
      window.removeEventListener('scroll', onScroll);

      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => setIsMuted(false)).catch(() => {});
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.currentTime = 0;
      audio.play().then(() => setIsMuted(false)).catch(() => {});
    } else {
      audio.pause();
      setIsMuted(true);
    }
  };

  return (
    <>
      <Image
        src="/images/hero-poster.webp"
        alt="Elevate for Humanity career training"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover z-0"
      />
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
        loop
        playsInline
        preload="auto"
        muted
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>
      <audio
        ref={audioRef}
        src="/videos/hero-video-segment-with-narration.mp3"
        preload="auto"
      />

      {/* Sound toggle */}
      {isPlaying && (
        <button
          onClick={toggleMute}
          className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            isMuted
              ? 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
              : 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
          }`}
          aria-label={isMuted ? 'Unmute narration' : 'Mute narration'}
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
