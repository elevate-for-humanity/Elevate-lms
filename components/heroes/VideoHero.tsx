'use client';

import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useHeroVideo } from '@/hooks/useHeroVideo';
import { UnmuteButton } from '@/components/ui/UnmuteButton';

interface VideoHeroProps {
  videoSrc: string;
  badge?: {
    icon: LucideIcon;
    text: string;
    href?: string;
  };
  headline: string;
  description?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  overlayColor?: string;
}

export function VideoHero({
  videoSrc,
  badge,
  headline,
  description,
  primaryCTA,
  secondaryCTA,
  overlayColor = 'from-black/60 via-black/50 to-black/70',
}: VideoHeroProps) {
  const { videoRef, showUnmuteButton, unmute } = useHeroVideo();

  return (
    <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      {showUnmuteButton && <UnmuteButton onClick={unmute} />}
      <div className="absolute inset-0 flex items-center justify-center text-center px-4">
        <div className="max-w-4xl w-full bg-black/50 backdrop-blur-sm p-8 rounded-2xl">
          {badge && (
            <div className="mb-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
              <badge.icon className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">
                {badge.text}
              </span>
            </div>
          )}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 text-white uppercase tracking-tight leading-tight">
            {headline}
          </h1>
          {description && (
            <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-3xl mx-auto">
              {description}
            </p>
          )}
          {(primaryCTA || secondaryCTA) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              {primaryCTA && (
                <Link
                  href={primaryCTA.href}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange-500 to-brand-orange-600 px-10 py-4 text-lg font-bold text-white shadow-2xl hover:from-brand-orange-600 hover:to-brand-orange-700 transition-all transform hover:scale-105"
                >
                  {primaryCTA.text}
                </Link>
              )}
              {secondaryCTA && (
                <Link
                  href={secondaryCTA.href}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-3 border-white bg-white/10 backdrop-blur-sm px-10 py-4 text-lg font-bold text-white hover:bg-white hover:text-black transition-all transform hover:scale-105"
                >
                  {secondaryCTA.text}
                </Link>
              )}
            </div>
          )}

          {/* Funding Badges */}
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <span className="text-white font-bold text-sm">WIOA Funded</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <span className="text-white font-bold text-sm">WRG Approved</span>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
              <span className="text-white font-bold text-sm">JRI Eligible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
