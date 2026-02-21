'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

export function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.loop = true;
    const playVideo = () => video.play().catch(() => {});
    playVideo();
    video.addEventListener('canplay', playVideo);
    return () => video.removeEventListener('canplay', playVideo);
  }, []);

  return (
    <section className="relative w-full">
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          autoPlay
          preload="auto"
        >
          <source src="/videos/hero-home.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="bg-slate-900 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3">
            Reach your career potential.
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-6 max-w-3xl mx-auto">
            Connect with training providers, get industry credentials, and build a higher paying career with Elevate for Humanity.
          </p>
          <Link
            href="/programs"
            className="inline-flex items-center gap-3 bg-brand-red-600 text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-brand-red-700 transition-colors"
          >
            Explore training paths near you
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
