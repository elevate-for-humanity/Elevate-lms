'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useHeroVideo } from '@/hooks/useHeroVideo';

interface VideoHeroBannerProps {
  title: string;
  subtitle: string;
  description?: string;
  videoSrc: string;
  posterImage?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  textPosition?: 'left' | 'center' | 'right';
  height?: 'full' | 'large' | 'medium';
  loop?: boolean;
  bannerId?: string;
}

export default function VideoHeroBanner({
  title,
  subtitle,
  description,
  videoSrc,
  posterImage,
  ctaText,
  ctaLink,
  secondaryCtaText,
  secondaryCtaLink,
  textPosition = 'left',
  height = 'large',
  loop = true,
  bannerId,
}: VideoHeroBannerProps) {
  const { videoRef } = useHeroVideo({ pauseOffScreen: false });
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function logBannerView() {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('banner_analytics').insert({
        banner_id: bannerId || 'video_hero',
        user_id: user?.id || null,
        event_type: 'impression',
        video_src: videoSrc,
        viewed_at: new Date().toISOString(),
      });
    }
    logBannerView();
  }, [bannerId, videoSrc, supabase]);

  const heightClasses = { full: 'min-h-screen', large: 'min-h-[80vh]', medium: 'min-h-[60vh]' };
  const textPositionClasses = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' };

  return (
    <section className={`relative ${heightClasses[height]} flex items-center overflow-hidden`}>
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          poster={posterImage}
          loop={loop}
          playsInline
          onLoadedData={() => setIsLoaded(true)}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        {!isLoaded && posterImage && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posterImage})` }} />
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className={`flex flex-col ${textPositionClasses[textPosition]} max-w-3xl ${textPosition === 'center' ? 'mx-auto' : textPosition === 'right' ? 'ml-auto' : ''}`}>
          <span className="inline-block px-4 py-2 bg-brand-blue-600/90 text-white text-sm font-semibold rounded-full mb-6 backdrop-blur-sm">
            {subtitle}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">{title}</h1>
          {description && <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">{description}</p>}
          <div className={`flex flex-wrap gap-4 ${textPosition === 'center' ? 'justify-center' : ''}`}>
            {ctaText && ctaLink && (
              <Link href={ctaLink} className="px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg">
                {ctaText}
              </Link>
            )}
            {secondaryCtaText && secondaryCtaLink && (
              <Link href={secondaryCtaLink} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm border border-white/30 transition-all">
                {secondaryCtaText}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
