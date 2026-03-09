'use client';

import { useRef, useState } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

interface HeroVideoWithVoiceoverProps {
  videoSrc: string;
  posterSrc?: string;
  voiceoverSrc?: string;
  children: React.ReactNode;
}

export default function HeroVideoWithVoiceover({
  videoSrc,
  posterSrc,
  voiceoverSrc,
  children,
}: HeroVideoWithVoiceoverProps) {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setAudioPlaying(true))
        .catch(() => {});
    }
  };

  return (
    <section className="relative bg-gray-900">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {voiceoverSrc && (
        <audio
          ref={audioRef}
          src={voiceoverSrc}
          preload="none"
          onEnded={() => setAudioPlaying(false)}
        />
      )}

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10">{children}</div>

      {showUnmuteButton && !voiceoverSrc && <UnmuteButton onClick={unmute} />}

      {voiceoverSrc && !audioPlaying && (
        <button
          onClick={handlePlayAudio}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          Play Audio Guide
        </button>
      )}
    </section>
  );
}
