'use client';

import React from 'react';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type HeroBannerProps = {
  title: string;
  subtitle: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  trustIndicators?: string[];
  // Video mode
  type?: 'image' | 'video';
  videoSrc?: string;
  voiceoverSrc?: string;
  posterSrc?: string;
  // Image mode
  heroImageSrc?: string;
  heroImageAlt?: string;
  overlay?: boolean;
};

export default function HeroBanner({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
  trustIndicators = [],
  type = 'image',
  videoSrc = '/video/hero-home-dec12.mp4',
  voiceoverSrc,
  posterSrc = '/images/hero/hero-dec12-poster.svg',
  heroImageSrc = '/images/hero/hero-main.svg',
  heroImageAlt = 'Elevate for Humanity hero banner',
  overlay = true,
}: HeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Always autoplay the muted video on load
  useEffect(() => {
    if (type !== 'video') return;

    const v = videoRef.current;
    if (!v) return;

    v.muted = true;
    v.loop = voiceoverSrc ? false : true; // no loop if voiceover present
    v.playsInline = true;

    v.play().catch(() => {
      // If even muted autoplay fails (rare), user gesture will be needed
    });
  }, [type, voiceoverSrc]);

  // Attempt to autoplay voiceover on load (may be blocked by browser)
  useEffect(() => {
    if (type !== 'video' || !voiceoverSrc) return;

    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    const attempt = async () => {
      try {
        v.muted = true;
        a.currentTime = v.currentTime || 0;
        await a.play();
        setAudioBlocked(false);
      } catch (error) {
        setAudioBlocked(true);
      }
    };

    attempt();
  }, [type, voiceoverSrc]);

  // Keep voiceover synced to video
  useEffect(() => {
    if (type !== 'video' || !voiceoverSrc) return undefined;

    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return undefined;

    const onPlay = async (): Promise<void> => {
      if (audioBlocked) return;
      try {
        a.currentTime = v.currentTime || 0;
        await a.play();
      } catch (error) {
        setAudioBlocked(true);
      }
    };

    const onPause = (): void => {
      a.pause();
    };

    const onSeeked = (): void => {
      a.currentTime = v.currentTime || 0;
      if (!v.paused && !audioBlocked) {
        a.play().catch(() => setAudioBlocked(true));
      }
    };

    const onTimeUpdate = (): void => {
      // Light drift correction
      const drift = Math.abs((a.currentTime || 0) - (v.currentTime || 0));
      if (drift > 0.35) a.currentTime = v.currentTime || 0;
    };

    const onEnded = (): void => {
      a.pause();
      a.currentTime = 0;
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('seeked', onSeeked);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('ended', onEnded);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('seeked', onSeeked);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('ended', onEnded);
    };
  }, [type, voiceoverSrc, audioBlocked]);

  // User gesture fallback: enable sound
  const enableSound = async () => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (!v || !a) return;

    try {
      v.muted = true;
      await v.play().catch(() => {
        // Video play blocked
      });
      a.currentTime = v.currentTime || 0;
      await a.play();
      setAudioBlocked(false);
    } catch (error) {
      setAudioBlocked(true);
    }
  };

  return (
    <section className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative h-[300px] md:h-[400px] w-full">
        {type === 'video' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={videoSrc}
              autoPlay
              muted
              playsInline
              preload="none"
            />
            {voiceoverSrc && (
              <audio ref={audioRef} src={voiceoverSrc} preload="none" />
            )}
          </>
        ) : (
          <Image
            src={heroImageSrc}
            alt={heroImageAlt}
            fill
            priority
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>
      <div className="bg-slate-900 py-10">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-slate-300 md:text-lg max-w-3xl mx-auto">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {primaryCta && (
              <a
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm hover:bg-gray-100 transition-colors"
              >
                {primaryCta.label}
              </a>
            )}
            {secondaryCta && (
              <a
                href={secondaryCta.href}
                className="inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-700 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
              >
                {secondaryCta.label}
              </a>
            )}
          </div>

          {trustIndicators && trustIndicators.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {trustIndicators.map((indicator, index) => (
                <span
                  key={index}
                  className="rounded-full bg-slate-700 px-3 py-2 text-xs font-medium text-slate-300"
                >
                  {indicator}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
