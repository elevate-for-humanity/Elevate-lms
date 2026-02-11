'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Volume2, VolumeX, VideoOff } from 'lucide-react';

interface PageAvatarProps {
  videoSrc: string;
  voiceoverSrc?: string;
  title?: string;
  position?: 'default' | 'inline';
  loop?: boolean;
}

export default function PageAvatar({ videoSrc, voiceoverSrc, title, position = 'default', loop = false }: PageAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioStartedRef = useRef(false);
  const unmuteAttemptedRef = useRef(false);

  // Try to unmute video on first user interaction
  useEffect(() => {
    const tryUnmute = () => {
      if (unmuteAttemptedRef.current) return;
      unmuteAttemptedRef.current = true;
      
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        setIsMuted(false);
      }
      
      if (voiceoverSrc && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };

    // Listen for user interaction to unmute
    window.addEventListener('click', tryUnmute, { once: true });
    window.addEventListener('touchstart', tryUnmute, { once: true });
    window.addEventListener('scroll', tryUnmute, { once: true });

    return () => {
      window.removeEventListener('click', tryUnmute);
      window.removeEventListener('touchstart', tryUnmute);
      window.removeEventListener('scroll', tryUnmute);
    };
  }, [voiceoverSrc]);

  // Autoplay voiceover on page load
  useEffect(() => {
    if (!voiceoverSrc) return;

    const tryPlayAudio = async () => {
      if (audioStartedRef.current || !audioRef.current) return;
      try {
        await audioRef.current.play();
        audioStartedRef.current = true;
        setIsPlaying(true);
        setIsMuted(false);
      } catch {
        // Autoplay blocked - will try on interaction
      }
    };

    // Try autoplay immediately
    tryPlayAudio();

    // Fallback: user interaction
    const handleInteraction = () => tryPlayAudio();
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('scroll', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
      // Stop audio on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioStartedRef.current = false;
    };
  }, [voiceoverSrc]);

  const toggleMute = () => {
    if (voiceoverSrc && audioRef.current) {
      if (isMuted) {
        audioRef.current.play();
        setIsMuted(false);
      } else {
        audioRef.current.pause();
        setIsMuted(true);
      }
    } else {
      const video = videoRef.current;
      if (video) {
        video.muted = !video.muted;
        setIsMuted(video.muted);
      }
    }
  };

  const handlePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.play();
      setIsPlaying(true);
    }
    if (voiceoverSrc && audioRef.current) {
      audioRef.current.play();
      setIsMuted(false);
    } else if (video) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  // Inline position for centered avatar under hero
  if (position === 'inline') {
    if (hasError) {
      return (
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-800 relative flex items-center justify-center">
          <VideoOff className="w-8 h-8 text-slate-400" />
        </div>
      );
    }
    return (
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          muted={isMuted}
          loop={loop}
          playsInline
          preload="auto"
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
        {voiceoverSrc && (
          <audio ref={audioRef} preload="auto">
            <source src={voiceoverSrc} type="audio/mpeg" />
          </audio>
        )}
        <button
          onClick={toggleMute}
          className="absolute bottom-1 right-1 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  // Error fallback
  if (hasError) {
    return (
      <section className="w-full bg-slate-100 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 relative">
            <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                <VideoOff className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{title || 'Video Guide'}</h3>
              <p className="text-slate-300 mb-4">Video is loading or unavailable. Please refresh the page to try again.</p>
              <button
                onClick={() => { setHasError(false); setIsLoaded(false); }}
                className="px-6 py-3 bg-brand-red-600 text-white font-semibold rounded-lg hover:bg-brand-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="rounded-2xl overflow-hidden shadow-xl bg-black relative">
          {/* Loading state */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-slate-600 border-t-white rounded-full animate-spin" />
                <span className="text-slate-300 text-sm">Loading video...</span>
              </div>
            </div>
          )}
          {/* Cropped video container to hide bottom branding */}
          <div className="relative overflow-hidden" style={{ paddingBottom: '50%' }}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-[110%] object-cover object-top"
              src={videoSrc}
              playsInline
              loop={loop}
              muted={isMuted}
              autoPlay
              preload="auto"
              onLoadedData={() => setIsLoaded(true)}
              onError={() => setHasError(true)}
            />
            {voiceoverSrc && (
              <audio ref={audioRef} preload="auto">
                <source src={voiceoverSrc} type="audio/mpeg" />
              </audio>
            )}
            {!isPlaying && !voiceoverSrc && (
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors z-20"
              >
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="w-10 h-10 text-slate-900 ml-1" fill="currentColor" />
                </div>
              </button>
            )}
          </div>
          {/* Mute/Unmute control */}
          <button
            onClick={toggleMute}
            className="absolute bottom-4 left-4 p-3 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors z-20"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          {/* Logo overlay */}
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
            <div className="bg-black/80 rounded px-2 py-1 flex items-center gap-1">
              <Image 
                src="/logo.png" 
                alt="Elevate" 
                width={20} 
                height={20} 
                className="opacity-90"
              />
              <span className="text-white text-xs font-medium">Elevate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
