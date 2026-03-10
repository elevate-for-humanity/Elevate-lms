'use client';

import { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

export default function ApplyHeroVideo() {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const toggleVoiceover = () => {
    const vo = voiceoverRef.current;
    if (!vo) return;
    if (!voiceActive) { vo.currentTime = 0; vo.play().catch(() => {}); setVoiceActive(true); }
    else { vo.pause(); setVoiceActive(false); }
  };

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        poster="/hero-images/programs-hero.jpg"
        loop muted playsInline autoPlay preload="metadata"
      >
        <source src="/videos/hero-home-fast.mp4" type="video/mp4" />
      </video>
      <audio ref={voiceoverRef} src="/audio/heroes/apply.mp3" preload="none" onEnded={() => setVoiceActive(false)} />
      <button
        onClick={toggleVoiceover}
        className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${voiceActive ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80' : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'}`}
        aria-label={voiceActive ? 'Stop narration' : 'Play narration'}
      >
        {voiceActive
          ? <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></>
          : <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Narration</span></>}
      </button>
    </>
  );
}
