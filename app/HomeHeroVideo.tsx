'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

export default function HomeHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  // Autoplay video muted on load
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const play = async () => {
      try {
        await video.play();
        setVideoPlaying(true);
      } catch {
        // Poster stays visible
      }
    };
    if (video.readyState >= 2) play();
    else video.addEventListener('loadeddata', play, { once: true });
    return () => video.removeEventListener('loadeddata', play);
  }, []);

  // Toggle voiceover — requires user click (browser autoplay policy)
  const toggleVoiceover = () => {
    const audio = voiceoverRef.current;
    if (!audio) return;

    if (voiceActive) {
      audio.pause();
      setVoiceActive(false);
    } else {
      audio.currentTime = 0;
      audio.play()
        .then(() => setVoiceActive(true))
        .catch(() => {});
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Poster fallback */}
      <Image
        src="/images/hero-poster.webp"
        alt="Elevate for Humanity career training"
        fill
        priority
        sizes="100vw"
        className="object-cover z-0"
      />

      {/* Background video — always muted, loops */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-700 ${videoPlaying ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        autoPlay
        preload="metadata"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      {/* Voiceover audio */}
      <audio
        ref={voiceoverRef}
        src="/audio/welcome-voiceover.mp3"
        preload="auto"
        onEnded={() => setVoiceActive(false)}
      />

      {/* Narration button — always visible, prominent */}
      <button
        onClick={toggleVoiceover}
        className={`absolute z-20 bottom-5 right-5 flex items-center gap-2 rounded-full shadow-lg px-5 py-3 transition-all ${
          voiceActive
            ? 'bg-white text-slate-900 hover:bg-slate-100'
            : 'bg-brand-red-600 text-white hover:bg-brand-red-700 animate-pulse'
        }`}
        aria-label={voiceActive ? 'Stop narration' : 'Listen to welcome message'}
      >
        {voiceActive ? (
          <>
            <Volume2 className="w-5 h-5" />
            <span className="text-sm font-semibold">Playing...</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span className="text-sm font-semibold">Listen</span>
          </>
        )}
      </button>
    </div>
  );
}
