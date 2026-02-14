
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';


interface VideoHeroBannerProps {
  videoSrc?: string;
  withAudio?: boolean;
  voiceoverSrc?: string;
  headline?: string;
  subheadline?: string;
  primaryCTA?: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
}

export default function VideoHeroBanner({
  videoSrc = '/videos/hero-home.mp4',
  withAudio = false,
  voiceoverSrc,
  headline = 'Elevate for Humanity',
  subheadline = 'Free, Funded Workforce Training',
  primaryCTA = { text: 'Apply Now', href: '/apply' },
  secondaryCTA = { text: 'Learn More', href: '/programs' },
}: VideoHeroBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsMounted(true);
    setShouldLoadVideo(true);
    
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoaded(true);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoaded(true);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    if (withAudio && video) {
      video.muted = false;
    }

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [withAudio, videoSrc]);

  const handleUserInteraction = () => {
    if (audioRef.current && voiceoverSrc && audioRef.current.paused) {
      audioRef.current.play().catch(() => { /* Autoplay blocked */ });
    }
  };

  // Check if this is being used as a standalone video (no headline)
  const isStandaloneVideo = !headline;

  if (isStandaloneVideo) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          loop
          muted={!withAudio}
          playsInline
          preload="metadata"
          autoPlay
          controls
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <section
      className="relative w-full bg-brand-blue-900"
      onClick={handleUserInteraction}
    >
      {/* Video Container - Full viewport height */}
      <div
        className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
        style={{
          height: 'calc(100vh - var(--header-h, 72px))',
          maxHeight: '900px',
        }}
      >
        {/* Video Background - loads immediately */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted={!withAudio}
          playsInline
          preload="metadata"
          autoPlay
        >
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Text Content - Centered vertically */}
        <div className="absolute inset-0 flex items-center z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 w-full">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight break-words drop-shadow-2xl">
                {headline}
              </h1>
              <p className="text-base md:text-lg text-white/90 mb-6 max-w-xl drop-shadow-lg">
                {subheadline}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={primaryCTA.href}
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-brand-blue-600 text-base font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                >
                  {primaryCTA.text}
                </Link>
                <Link
                  href={secondaryCTA.href}
                  className="inline-flex items-center justify-center px-6 py-3 bg-transparent text-white text-base font-bold rounded-xl hover:bg-white/10 transition-colors border-2 border-white"
                >
                  {secondaryCTA.text}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Voiceover Audio */}
        {voiceoverSrc && (
          <audio ref={audioRef} muted={false}>
            <source src={voiceoverSrc} type="audio/mpeg" />
          </audio>
        )}
      </div>
    </section>
  );
}
