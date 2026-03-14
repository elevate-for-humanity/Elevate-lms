'use client';

import React from 'react';

import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  posterImage?: string;
  videoSrc?: string;
  voiceoverSrc?: string;
  overlay?: boolean;
};

export default function HeroMedia({
  posterImage,
  videoSrc,
  voiceoverSrc,
  overlay = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [soundRequested, setSoundRequested] = useState(false);
  const [canAutoPlayAudio, setCanAutoPlayAudio] = useState(false);
  const [audioReady, setAudioReady] = useState(false);

  const hasVideo = Boolean(videoSrc);
  const hasVoice = Boolean(voiceoverSrc);

  const poster = useMemo(() => posterImage || '', [posterImage]);

  // Video: always try autoplay muted (allowed)
  useEffect(() => {
    if (!hasVideo || !videoRef.current) return;
    const v = videoRef.current;
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;
    v.loop = !hasVoice;
    v.play().catch(() => {
      // Autoplay blocked by browser
    });
  }, [hasVideo, hasVoice]);

  // Audio readiness
  useEffect(() => {
    if (!hasVoice || !audioRef.current) return;
    const a = audioRef.current;

    const onCanPlay = () => setAudioReady(true);
    a.addEventListener('canplay', onCanPlay);

    return () => a.removeEventListener('canplay', onCanPlay);
  }, [hasVoice]);

  // Attempt to auto-play audio (usually blocked)
  useEffect(() => {
    if (!hasVoice || !audioRef.current) return;
    const a = audioRef.current;

    a.play()
      .then(() => {
        setCanAutoPlayAudio(true);
        setSoundRequested(true);
      })
      .catch(() => {
        setCanAutoPlayAudio(false);
      });
  }, [hasVoice]);

  const startSound = async () => {
    try {
      setSoundRequested(true);

      const v = videoRef.current;
      if (v) {
        v.muted = true;
        if (v.paused)
          await v.play().catch(() => {
            // Video play blocked
          });
        v.loop = false;
      }

      const a = audioRef.current;
      if (a) {
        a.currentTime = 0;
        await a.play();
      }
    } catch (error) { /* Error handled silently */ }
  };

  const onAudioEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      {hasVideo ? (
        <video
          ref={videoRef}
          className="h-[420px] w-full object-cover md:h-[520px]"
          muted
          playsInline
          autoPlay
          preload="none"
        >
          <source src={videoSrc} />
        </video>
      ) : (
        <div
          className="h-[420px] w-full md:h-[520px] bg-cover bg-center"
          style={{ backgroundImage: poster ? `url(${poster})` : undefined }}
        >
          {!poster && (
            <div className="flex h-full w-full items-center justify-center text-sm opacity-70">
              Add hero image here
            </div>
          )}
        </div>
      )}

      {overlay && (
      )}

      {hasVoice && (
        <audio
          ref={audioRef}
          src={voiceoverSrc}
          preload="none"
          onEnded={onAudioEnded}
        />
      )}
    </div>
  );
}
