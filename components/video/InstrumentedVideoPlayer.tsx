'use client';

import { createClient } from '@/lib/supabase/client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle, RefreshCw } from 'lucide-react';
import { VideoRecord, getVideoCacheUrl } from '@/lib/video/registry';

interface InstrumentedVideoPlayerProps {
  video: VideoRecord;
  pageSlug: string;
  autoplay?: boolean;
  muted?: boolean;
  showControls?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

type PlaybackEventType = 'load_start' | 'can_play' | 'play' | 'pause' | 'ended' | 'error' | 'progress';

/**
 * Instrumented Video Player
 * 
 * Features:
 * - Canonical video registry integration
 * - Playback event instrumentation
 * - Autoplay with sound fallback overlay
 * - Error handling with fallback UI
 * - Progress tracking
 */
export default function InstrumentedVideoPlayer({
  video,
  pageSlug,
  autoplay = false,
  muted = false,
  showControls = true,
  onProgress,
  onComplete,
  className = '',
}: InstrumentedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);
  const [sessionId] = useState(() => `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const supabase = createClient();

  // Track playback events - direct DB insert
  const trackEvent = useCallback(async (eventType: PlaybackEventType, extraData?: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Direct DB insert for video events
      await supabase
        .from('video_playback_events')
        .insert({
          event_type: eventType,
          video_id: video.id,
          user_id: user?.id,
          page_slug: pageSlug,
          current_time: videoRef.current?.currentTime,
          duration: videoRef.current?.duration,
          session_id: sessionId,
          extra_data: extraData,
          timestamp: new Date().toISOString()
        });

      // Also call API as fallback
      await fetch('/api/video/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          video_id: video.id,
          page_slug: pageSlug,
          current_time: videoRef.current?.currentTime,
          duration: videoRef.current?.duration,
          session_id: sessionId,
          ...extraData,
        }),
      });
    } catch (e) {
      // Silent fail for analytics
      console.debug('Failed to track video event', e);
    }
  }, [video.id, pageSlug, sessionId, supabase]);

  // Handle autoplay with sound fallback
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !autoplay) return;

    trackEvent('load_start');

    const attemptAutoplay = async () => {
      try {
        // First try unmuted autoplay
        videoEl.muted = false;
        await videoEl.play();
        setIsPlaying(true);
        trackEvent('play');
      } catch (e) {
        // Browser blocked unmuted autoplay, try muted
        try {
          videoEl.muted = true;
          setIsMuted(true);
          await videoEl.play();
          setIsPlaying(true);
          setShowSoundOverlay(true); // Show overlay to enable sound
          trackEvent('play');
        } catch (e2) {
          // Autoplay completely blocked
          console.debug('Autoplay blocked', e2);
        }
      }
    };

    attemptAutoplay();
  }, [autoplay, trackEvent]);

  // Handle sound overlay click
  const handleSoundOverlayClick = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = false;
    setIsMuted(false);
    setShowSoundOverlay(false);
    
    if (!isPlaying) {
      videoEl.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      trackEvent('can_play');
    }
  }, [trackEvent]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setCurrentTime(time);
      
      const progress = (time / dur) * 100;
      onProgress?.(progress);

      // Track progress at 25%, 50%, 75%
      if (progress >= 25 && progress < 26) trackEvent('progress', { milestone: 25 });
      if (progress >= 50 && progress < 51) trackEvent('progress', { milestone: 50 });
      if (progress >= 75 && progress < 76) trackEvent('progress', { milestone: 75 });
    }
  }, [onProgress, trackEvent]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    trackEvent('ended');
    onComplete?.();
  }, [onComplete, trackEvent]);

  const handleError = useCallback(() => {
    const videoEl = videoRef.current;
    const error = videoEl?.error;
    const message = error?.message || 'Video playback failed';
    
    setHasError(true);
    setErrorMessage(message);
    setIsLoading(false);
    trackEvent('error', { error_message: message });
  }, [trackEvent]);

  // Control handlers
  const togglePlay = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (isPlaying) {
      videoEl.pause();
      setIsPlaying(false);
      trackEvent('pause');
    } else {
      videoEl.play().catch(() => {});
      setIsPlaying(true);
      trackEvent('play');
    }
  }, [isPlaying, trackEvent]);

  const toggleMute = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const time = parseFloat(e.target.value);
    videoEl.currentTime = time;
    setCurrentTime(time);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoEl.requestFullscreen();
    }
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.load();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Error state
  if (hasError) {
    return (
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex flex-col items-center justify-center text-white p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Video Unavailable</h3>
          <p className="text-gray-400 text-center mb-4">{errorMessage}</p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href="/support"
            className="mt-4 text-sm text-brand-blue-400 hover:underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  const videoUrl = getVideoCacheUrl(video);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden group ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-brand-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white mt-4">Loading video...</p>
          </div>
        </div>
      )}

      {/* Sound overlay for autoplay fallback */}
      {showSoundOverlay && (
        <button
          onClick={handleSoundOverlayClick}
          className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center cursor-pointer"
        >
          <div className="bg-white/90 rounded-xl px-6 py-4 flex items-center gap-3 shadow-xl">
            <Volume2 className="w-6 h-6 text-brand-blue-600" />
            <span className="text-gray-900 font-semibold">Tap to play with sound</span>
          </div>
        </button>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={video.thumbnail_url}
        className="w-full aspect-video"
        preload="metadata"
        playsInline
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Controls */}
      {showControls && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Progress bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-brand-blue-500 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-brand-blue-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>

              <button
                onClick={toggleMute}
                className="text-white hover:text-brand-blue-400 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-brand-blue-400 transition-colors"
              aria-label="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
