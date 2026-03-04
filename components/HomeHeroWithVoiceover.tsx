'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface HeroConfig {
  video_src: string;
  audio_src: string;
  headline?: string;
  subheadline?: string;
  cta_text?: string;
  cta_link?: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  overlay_opacity?: number;
}

interface HomeHeroWithVoiceoverProps {
  videoSrc?: string;
  audioSrc?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HomeHeroWithVoiceover({
  videoSrc: propVideoSrc,
  audioSrc: propAudioSrc,
  headline: propHeadline,
  subheadline: propSubheadline,
  ctaText: propCtaText,
  ctaLink: propCtaLink,
}: HomeHeroWithVoiceoverProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showButton, setShowButton] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [config, setConfig] = useState<HeroConfig>({
    video_src: propVideoSrc || '/videos/hero.mp4',
    audio_src: propAudioSrc || '/audio/voiceover.mp3',
    headline: propHeadline,
    subheadline: propSubheadline,
    cta_text: propCtaText || 'Get Started',
    cta_link: propCtaLink || '/apply',
    overlay_opacity: 0.4,
  });

  // Fetch hero config from database
  useEffect(() => {
    async function fetchConfig() {
      const supabase = createClient();

      try {
        const { data: heroConfig } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'home_hero_config')
          .single();

        if (heroConfig?.value) {
          const parsed = JSON.parse(heroConfig.value);
          setConfig(prev => ({
            ...prev,
            ...parsed,
            // Props override database config
            video_src: propVideoSrc || parsed.video_src || prev.video_src,
            audio_src: propAudioSrc || parsed.audio_src || prev.audio_src,
            headline: propHeadline || parsed.headline,
            subheadline: propSubheadline || parsed.subheadline,
            cta_text: propCtaText || parsed.cta_text || prev.cta_text,
            cta_link: propCtaLink || parsed.cta_link || prev.cta_link,
          }));
        }
      } catch (err) {
        // Use default config
      }
    }

    fetchConfig();
  }, [propVideoSrc, propAudioSrc, propHeadline, propSubheadline, propCtaText, propCtaLink]);

  // Track hero interaction
  const trackInteraction = async (action: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('analytics_events').insert({
      event_type: 'hero_interaction',
      event_data: { action },
      user_id: user?.id,
      page_url: window.location.href,
    }).catch(() => {});
  };

  const handlePlaySound = () => {
    if (videoRef.current && audioRef.current) {
      videoRef.current.muted = true;
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setShowButton(false);
          setIsPlaying(true);
          setIsMuted(false);
          trackInteraction('play_voiceover');
        })
        .catch(() => {
          // Audio play failed
        });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.play().catch(() => {});
        setIsMuted(false);
        setIsPlaying(true);
        trackInteraction('unmute');
      } else {
        audioRef.current.pause();
        setIsMuted(true);
        setIsPlaying(false);
        trackInteraction('mute');
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        trackInteraction('play_video');
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
        trackInteraction('pause_video');
      }
    }
  };

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setShowButton(true);
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  return (
    <section className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/images/pages/home-hero-video.jpg"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source src={config.video_src} type="video/mp4" />
      </video>

      {/* Voiceover Audio */}
      <audio ref={audioRef} src={config.audio_src} preload="none" />

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"
        style={{ opacity: config.overlay_opacity }}
      />

      {/* Content */}
      {(config.headline || config.subheadline) && (
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              {config.headline && (
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                  {config.headline}
                </h1>
              )}
              {config.subheadline && (
                <p className="text-lg md:text-xl text-white/90 mb-8">
                  {config.subheadline}
                </p>
              )}
              <div className="flex flex-wrap gap-4">
                {config.cta_text && config.cta_link && (
                  <Link
                    href={config.cta_link}
                    onClick={() => trackInteraction('cta_click')}
                    className="px-8 py-4 bg-brand-blue-600 text-white font-bold rounded-lg hover:bg-brand-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    {config.cta_text}
                  </Link>
                )}
                {config.secondary_cta_text && config.secondary_cta_link && (
                  <Link
                    href={config.secondary_cta_link}
                    onClick={() => trackInteraction('secondary_cta_click')}
                    className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-lg hover:bg-white/30 transition-all border border-white/30"
                  >
                    {config.secondary_cta_text}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* Play/Pause Video */}
        <button
          onClick={togglePlayPause}
          className="p-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full hover:bg-white/30 transition-all"
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>

        {/* Sound Toggle */}
        {showButton ? (
          <button
            onClick={handlePlaySound}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-full hover:bg-white/30 transition-all"
          >
            <Volume2 className="w-5 h-5" />
            <span className="hidden sm:inline">Play with Sound</span>
          </button>
        ) : (
          <button
            onClick={toggleMute}
            className="p-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-full hover:bg-white/30 transition-all"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/70 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}

export default HomeHeroWithVoiceover;
