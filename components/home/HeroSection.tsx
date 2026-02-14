'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface HeroSectionProps {
  user?: { id?: string } | null;
  activeEnrollment?: { progress?: number } | null;
  isLoading?: boolean;
}

export default function HeroSection({ user, activeEnrollment, isLoading = false }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    const forcePlay = async () => {
      if (!video.paused) return;
      try {
        video.muted = true;
        await video.play();
      } catch {
        // Silent fail
      }
    };

    forcePlay();
    const t1 = setTimeout(forcePlay, 100);
    const t2 = setTimeout(forcePlay, 500);

    video.addEventListener('canplay', forcePlay);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      video.removeEventListener('canplay', forcePlay);
    };
  }, []);

  return (
    <section className="relative w-full h-[60vh] sm:h-[65vh] md:h-[70vh] overflow-hidden bg-slate-900">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        autoPlay
        preload="metadata"
        poster="/images/heroes-hq/homepage-hero.jpg"
      >
        <source src="https://pub-23811be4d3844e45a8bc2d3dc5e7aaec.r2.dev/videos/hero-home-fast.mp4" type="video/mp4" />
      </video>
      
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`flex flex-wrap gap-4 justify-center transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {!isLoading && (
              <>
                {user && activeEnrollment ? (
                  <Link 
                    href="/lms/dashboard"
                    className="inline-flex items-center justify-center bg-green-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 transition-all text-lg"
                  >
                    Continue Learning
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/apply"
                      className="inline-flex items-center justify-center bg-brand-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-brand-blue-700 transition-all text-lg"
                    >
                      Apply Now
                    </Link>
                    <Link 
                      href="/programs"
                      className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold hover:bg-white/30 transition-all text-lg border border-white/30"
                    >
                      View Programs
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
