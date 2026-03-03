'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function ProgramsHeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const voiceoverRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

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

  // Auto-start voiceover on page load — plays once, no loop
  const toggleVoiceover = () => {
    const vo = voiceoverRef.current;
    if (!vo) return;
    if (!voiceActive) { vo.currentTime = 0; vo.play().catch(() => {}); setVoiceActive(true); }
    else { vo.pause(); setVoiceActive(false); }
  };

  return (
    <>
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover brightness-110" loop muted playsInline autoPlay preload="metadata" poster="/images/programs-hq/training-classroom.jpg">
        <source src="/videos/programs-overview-video-with-narration.mp4" type="video/mp4" />
      </video>
      <audio ref={voiceoverRef} src="/audio/heroes/programs.mp3" preload="none" onEnded={() => setVoiceActive(false)} />
      {isPlaying && (
        <button onClick={toggleVoiceover} className={`absolute z-20 flex items-center gap-2 backdrop-blur-sm text-white rounded-full shadow-lg transition-all ${voiceActive ? 'bottom-4 right-4 px-4 py-2.5 bg-black/60 hover:bg-black/80' : 'bottom-6 right-6 px-5 py-3 bg-brand-red-600 hover:bg-brand-red-700 animate-pulse'}`} aria-label={voiceActive ? 'Stop narration' : 'Play narration'}>
          {voiceActive ? <><Volume2 className="w-5 h-5" /><span className="text-sm font-semibold hidden sm:inline">Narration On</span></> : <><VolumeX className="w-5 h-5" /><span className="text-sm font-bold">Tap for Narration</span></>}
        </button>
      )}
    </>
  );
}
