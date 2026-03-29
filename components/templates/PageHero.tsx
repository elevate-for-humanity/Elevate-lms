'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX } from 'lucide-react';
import { getHeroImage, isVideoHero, shouldPrioritizeHero } from '@/lib/hero-config';
import CanonicalVideo from '@/components/video/CanonicalVideo';

interface PageHeroProps {
  title?: string;
  description?: string;
  forceHero?: string;
}

export default function PageHero({ title, description, forceHero }: PageHeroProps) {
  const pathname = usePathname();
  const heroSrc = forceHero ?? getHeroImage(pathname);
  const wrapperRef = useRef<HTMLElement>(null);
  const [muted, setMuted] = useState(true);

  if (!heroSrc) {
    return title ? (
      <div className="bg-gradient-to-r from-brand-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
          {description && <p className="text-xl text-brand-blue-100">{description}</p>}
        </div>
      </div>
    ) : null;
  }

  const isVideo = isVideoHero(heroSrc);
  const priority = shouldPrioritizeHero(pathname);

  function toggleMute() {
    const video = wrapperRef.current?.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
    setMuted(video.muted);
  }

  return (
    <section
      ref={wrapperRef}
      className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] min-h-[320px] w-full overflow-hidden"
    >
      {isVideo ? (
        <CanonicalVideo
          src={heroSrc}
          poster="/images/og-default.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlayOnMount
        />
      ) : (
        <Image
          src={heroSrc}
          alt={title || 'Hero'}
          fill
          className="object-cover"
          quality={100}
          priority={priority}
          unoptimized
        />
      )}

      {title && (
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>
            {description && <p className="text-xl text-white/90">{description}</p>}
          </div>
        </div>
      )}

      {/* Mute button — only shown for video heroes */}
      {isVideo && (
        <button
          onClick={toggleMute}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/60 hover:bg-black/80 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors backdrop-blur-sm border border-white/20"
        >
          {muted ? (
            <>
              <VolumeX className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Tap to hear</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 flex-shrink-0 text-brand-red-400" />
              <span className="hidden sm:inline">Mute</span>
            </>
          )}
        </button>
      )}
    </section>
  );
}
