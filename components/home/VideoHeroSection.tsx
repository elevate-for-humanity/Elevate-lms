'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function VideoHeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger content animation after mount
    setTimeout(() => setShowContent(true), 100);
    
    const video = videoRef.current;
    if (!video) return undefined;

    const handleCanPlay = () => setVideoLoaded(true);
    video.addEventListener('canplay', handleCanPlay);

    const playVideo = async () => {
      try {
        video.muted = true;
        video.playsInline = true;
        await video.play();
        setIsPlaying(true);
      } catch {
        // Autoplay blocked - image fallback will show
      }
    };

    playVideo();

    const handleInteraction = () => {
      if (!isPlaying && video.paused) {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('click', handleInteraction, { once: true });

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [isPlaying]);

  return (
    <section className="relative w-full min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] flex items-end bg-slate-900 overflow-hidden">
      {/* Fallback Image - always present for mobile */}
      <Image
        src="/images/artlist/hero-training-1.jpg"
        alt="Career Training"
        fill
        className="object-cover"
        priority
      />
      
      {/* Video Background - only on larger screens */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 hidden sm:block ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        loop
        muted
        playsInline
        autoPlay
        preload="metadata"
      >
        <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home.mp4" type="video/mp4" />
      </video>

      {/* Subtle overlay for text readability */}
      

      {/* Content */}
      <div className="relative w-full pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Headline with animation */}
          <h1 
            className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-3xl transition-all duration-700 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Free Career Training for Indiana
          </h1>
          
          {/* Subheadline with delayed animation */}
          <p 
            className={`text-lg sm:text-xl text-white/90 mb-8 max-w-xl transition-all duration-700 delay-200 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Get certified. Get hired. No tuition for eligible residents.
          </p>

          {/* CTA buttons with delayed animation */}
          <div 
            className={`flex flex-col sm:flex-row gap-3 transition-all duration-700 delay-400 ${
              showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link
              href="/apply"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-blue-600 text-white text-lg font-bold rounded-lg hover:bg-brand-blue-700 hover:scale-105 transition-all shadow-lg"
            >
              Apply Now
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white text-lg font-bold rounded-lg hover:bg-white/20 transition-all border-2 border-white/50"
            >
              View Programs
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
