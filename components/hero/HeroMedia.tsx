'use client';

import { useRef, useEffect } from 'react';
import { useHeroVideo } from '@/hooks/useHeroVideo';

type Props = {
  posterImage?: string;
  videoSrc?: string;
  voiceoverSrc?: string;
  overlay?: boolean;
};

export default function HeroMedia({ posterImage, videoSrc, voiceoverSrc, overlay = true }: Props) {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef(false);

  const hasVideo = Boolean(videoSrc);
  const hasVoice = Boolean(voiceoverSrc);

  useEffect(() => {
    if (!hasVoice || !audioRef.current || playedRef.current) return;
    playedRef.current = true;
    const audio = audioRef.current;
    audio.volume = 1;
    audio.muted = false;
    audio.play().catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
      const unmute = () => {
        audio.muted = false;
        window.removeEventListener('scroll', unmute, true);
        window.removeEventListener('touchmove', unmute, true);
      };
      window.addEventListener('scroll', unmute, { capture: true, passive: true });
      window.addEventListener('touchmove', unmute, { capture: true, passive: true });
    });
  }, [hasVoice]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {hasVideo ? (
        <video
          ref={videoRef}
          className="h-[420px] w-full object-cover md:h-[520px]"
          playsInline
          preload="none"
        >
          <source src={videoSrc} />
        </video>
      ) : (
        <div
          className="h-[420px] w-full md:h-[520px] bg-cover bg-center"
          style={{ backgroundImage: posterImage ? `url(${posterImage})` : undefined }}
        />
      )}
      {hasVoice && (
        <audio ref={audioRef} src={voiceoverSrc} preload="none" aria-hidden="true" />
      )}
    </div>
  );
}
