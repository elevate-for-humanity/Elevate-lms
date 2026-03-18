'use client';

import { useState } from 'react';

import { useHeroVideo } from '@/hooks/useHeroVideo';
import VoiceoverWithMusic from '@/components/VoiceoverWithMusic';

interface ProgramHeroBannerProps {
  videoSrc: string;
  voiceoverSrc?: string;
  posterImage?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export default function ProgramHeroBanner({ videoSrc, voiceoverSrc, posterImage, title, subtitle, badge }: ProgramHeroBannerProps) {
  const { videoRef } = useHeroVideo();
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!videoFailed ? (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={videoSrc}
          poster={posterImage}
          autoPlay loop muted playsInline preload="auto"
          onError={() => setVideoFailed(true)}
        />
      ) : posterImage ? (
        <img src={posterImage} alt={title || 'Program hero'} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-slate-100" />
      )}

      {/* No gradient overlay. No text on video.
          title/subtitle/badge props are deprecated — render messaging below the hero instead. */}

      {voiceoverSrc && <VoiceoverWithMusic audioSrc={voiceoverSrc} />}
    </div>
  );
}
