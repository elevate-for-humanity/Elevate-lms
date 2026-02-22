'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  // Autoplay silent video
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

  // Voiceover plays on user tap only — browsers block autoplay with audio

  const toggleVoiceover = () => {
    const voiceover = voiceoverRef.current;
    if (!voiceover) return;

    if (!voiceActive) {
      voiceover.currentTime = 0;
      voiceover.play().catch(() => {});
      setVoiceActive(true);
    } else {
      voiceover.pause();
      setVoiceActive(false);
    }
  };

  return (
    <>
      <Image src="/images/hero-poster.webp" alt="Elevate for Humanity career training" fill priority sizes="100vw" className="object-cover z-0" />
      {/* Video has no audio track — purely visual */}
      <video ref={videoRef} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} loop muted playsInline autoPlay preload="metadata">
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      {/* Voiceover narration — plays on tap */}
      <audio ref={voiceoverRef} src="/audio/welcome-voiceover.mp3" preload="none" onEnded={() => setVoiceActive(false)} />

      {isPlaying && (
        <button
          onClick={toggleVoiceover}
          className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${
            voiceActive
              ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
              : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
          }`}
          aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
        >
          {voiceActive ? (
            <>
              <Volume2 className="w-5 h-5" />
              <span className="text-sm font-semibold hidden sm:inline">Narration On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-5 h-5" />
              <span className="text-sm font-bold">Tap for Narration</span>
            </>
          )}
        </button>
      )}
    </>
  );
}
