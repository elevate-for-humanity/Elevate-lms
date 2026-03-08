'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomeHeroVideo() {
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  // Set volume to max as soon as audio element is available
  useEffect(() => {
    const audio = voiceoverRef.current;
    if (!audio) return;
    audio.volume = 1.0;
  }, []);

  const toggleVoiceover = () => {
    const audio = voiceoverRef.current;
    if (!audio) return;
    audio.volume = 1.0;
    if (!voiceActive) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      setVoiceActive(true);
    } else {
      audio.pause();
      setVoiceActive(false);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Poster — shown until video loads */}
      <Image
        src="/images/pages/home-hero-video.jpg"
        alt="Elevate for Humanity career training"
        fill priority sizes="100vw"
        className="object-cover object-center"
      />
      {/* Silent looping video — plays immediately on load */}
      <video
        autoPlay muted loop playsInline
        onCanPlay={() => setVideoReady(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
        poster="/images/pages/home-hero-video.jpg"
        preload="auto"
      >
        <source src="/videos/homepage-hero-montage.mp4" type="video/mp4" />
      </video>

      {/* Voiceover audio — volume forced to 1.0 */}
      <audio
        ref={voiceoverRef}
        src="/audio/welcome-voiceover.mp3"
        preload="auto"
        onEnded={() => setVoiceActive(false)}
      />

      {/* Narration button — always visible, pulses when off */}
      <button
        onClick={toggleVoiceover}
        className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all
          ${voiceActive
            ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80'
            : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'
          }`}
        aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
      >
        {voiceActive
          ? <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></>
          : <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Narration</span></>
        }
      </button>
    </div>
  );
}
