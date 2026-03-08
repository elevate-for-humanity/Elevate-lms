
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener('canplay', () => setIsLoaded(true), { once: true });
    video.addEventListener('error', () => { setHasError(true); setIsLoaded(true); }, { once: true });
  }, [videoSrc]);

  // Autoplay video + voiceover when banner scrolls into view
  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            // Video background stays muted (background loop)
            video.muted = true;
            video.play().catch(() => {});

            // Voiceover: attempt unmuted autoplay, silent fail if blocked
            const audio = audioRef.current;
            if (audio && voiceoverSrc) {
              audio.currentTime = 0;
              audio.muted = false;
              audio.play().catch(() => {});
            }
          } else {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [voiceoverSrc]);

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
      ref={sectionRef}
      className="relative w-full bg-brand-blue-900"
    >
      {/* Video Container - Full viewport height */}
      <div
        className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px]"
        style={{
          height: 'calc(100vh - var(--header-h, 72px))',
          maxHeight: '900px',
        }}
      >
        {/* Video Background */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
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
