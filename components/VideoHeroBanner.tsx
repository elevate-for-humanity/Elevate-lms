'use client';

import { createClient } from '@/lib/supabase/client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';

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
  overlayOpacity?: number;
  textPosition?: 'left' | 'center' | 'right';
  height?: 'full' | 'large' | 'medium';
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
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
  overlayOpacity = 0.5,
  textPosition = 'left',
  height = 'large',
  autoPlay = true,
  loop = true,
  showControls = true,
  bannerId,
}: VideoHeroBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const supabase = createClient();

  // Log banner view and track engagement
  useEffect(() => {
    async function logBannerView() {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Log banner impression
      await supabase
        .from('banner_analytics')
        .insert({
          banner_id: bannerId || 'video_hero',
          user_id: user?.id || null,
          event_type: 'impression',
          video_src: videoSrc,
          viewed_at: new Date().toISOString()
        });
    }
    logBannerView();
  }, [bannerId, videoSrc, supabase]);

  // Log video play/pause events
  const logVideoEvent = async (eventType: 'play' | 'pause' | 'complete') => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('video_engagement')
      .insert({
        video_src: videoSrc,
        user_id: user?.id || null,
        event_type: eventType,
        timestamp: new Date().toISOString()
      });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
      if (autoPlay) {
        video.play().catch(() => {
          // Autoplay blocked, user interaction required
          setIsPlaying(false);
        });
      }
    }
  }, [autoPlay, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const heightClasses = {
    full: 'min-h-screen',
    large: 'min-h-[80vh]',
    medium: 'min-h-[60vh]',
  };

  const textPositionClasses = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  };

  return (
    <section className={`relative ${heightClasses[height]} flex items-center overflow-hidden`}>
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          poster={posterImage}
          loop={loop}
          muted={isMuted}
          playsInline
          onLoadedData={() => setIsLoaded(true)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Fallback poster while loading */}
        {!isLoaded && posterImage && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${posterImage})` }}
          />
        )}
        
        {/* Content background for readability */}
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className={`flex flex-col ${textPositionClasses[textPosition]} max-w-3xl ${
          textPosition === 'center' ? 'mx-auto' : textPosition === 'right' ? 'ml-auto' : ''
        }`}>
          {/* Subtitle/Badge */}
          <span className="inline-block px-4 py-2 bg-brand-blue-600/90 text-white text-sm font-semibold rounded-full mb-6 backdrop-blur-sm">
            {subtitle}
          </span>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
              {description}
            </p>
          )}

          {/* CTA Buttons */}
          <div className={`flex flex-wrap gap-4 ${
            textPosition === 'center' ? 'justify-center' : ''
          }`}>
            {ctaText && ctaLink && (
              <Link
                href={ctaLink}
                className="px-8 py-4 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {ctaText}
              </Link>
            )}
            {secondaryCtaText && secondaryCtaLink && (
              <Link
                href={secondaryCtaLink}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg backdrop-blur-sm border border-white/30 transition-all"
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Video Controls */}
      {showControls && (
        <div className="absolute bottom-8 right-8 z-20 flex gap-3">
          <button
            onClick={togglePlay}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all border border-white/20"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-all border border-white/20"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
