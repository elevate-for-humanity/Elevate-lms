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

      {/* Gradient + text overlay */}
      {(title || subtitle || badge) && (
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
          <div className="max-w-3xl">
            {badge && (
              <span className="inline-block bg-brand-red-600 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                {badge}
              </span>
            )}
            {title && (
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-base md:text-lg text-white/90 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {voiceoverSrc && <VoiceoverWithMusic audioSrc={voiceoverSrc} />}
    </div>
  );
}
