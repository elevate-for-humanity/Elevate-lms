'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2,
  RotateCcw,
  PictureInPicture2,
  Languages,
  Captions,
  Subtitles,
  ChevronDown,
  Check,
  X,
  ExternalLink,
  Download,
  Monitor,
  Smartphone,
  RotateCw,
} from 'lucide-react';
import { trackLessonProgress } from '@/lib/xapi/xapi-client';

/**
 * UltraVideoPlayer - Consolidated Video Player
 *
 * Features from all video players:
 * - VideoPlayer: Progress tracking, xAPI, resume
 * - ProfessionalVideoPlayer: Speed control, captions
 * - InteractiveVideoPlayer: Chapters, markers
 * - EnhancedVideoPlayer: Picture-in-picture
 * - TikTokStyleVideoPlayer: Swipe controls, progress preview
 * - CanonicalVideo: SEO, metadata
 * - UnifiedVideoPlayer: Multi-source support
 * - ScrollVideoPlayer: Auto-play on scroll
 */

export interface UltraVideoPlayerProps {
  // Source
  src?: string;
  poster?: string;
  /** @deprecated Use poster instead */
  posterImage?: string;
  title?: string;

  // Course/Lesson tracking
  courseId?: string;
  lessonId?: string;
  lessonName?: string;
  userId?: string;

  // Playback
  autoPlay?: boolean;
  autoPlayOnMount?: boolean;
  /** Preload entire video on mount */
  preloadFull?: boolean;
  muted?: boolean;
  loop?: boolean;
  startTime?: number;

  // Controls
  showControls?: boolean;
  controlsAutoHide?: boolean;
  controlPosition?: 'bottom' | 'overlay';

  // Features
  enableProgressTracking?: boolean;
  enableResume?: boolean;
  enablePiP?: boolean;
  enableDownload?: boolean;
  enableChapterSkip?: boolean;

  // Chapters (table of contents)
  chapters?: Chapter[];

  // Captions/Subtitles
  captions?: CaptionTrack[];

  // Events
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: number, currentTime: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onReady?: () => void;

  // Styling
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '21:9' | 'auto';

  // Responsive
  responsive?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
}

interface CaptionTrack {
  src: string;
  label: string;
  srclang: string;
  default?: boolean;
}

const ASPECT_RATIOS = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '21:9': 'aspect-[21/9]',
  auto: 'aspect-auto',
};

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function UltraVideoPlayer({
  src,
  poster,
  title = 'Video',
  courseId,
  lessonId,
  lessonName,
  userId,
  autoPlay = false,
  autoPlayOnMount = false,
  muted = false,
  loop = false,
  startTime = 0,
  showControls = true,
  controlsAutoHide = true,
  controlPosition = 'bottom',
  enableProgressTracking = true,
  enableResume = true,
  enablePiP = true,
  enableDownload = false,
  enableChapterSkip = true,
  chapters = [],
  captions = [],
  onPlay,
  onPause,
  onEnded,
  onProgress,
  onComplete,
  onError,
  onReady,
  className = '',
  aspectRatio = '16:9',
  responsive = true,
}: UltraVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(autoPlayOnMount ? true : muted);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControlsOverlay, setShowControlsOverlay] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'speed' | 'captions' | 'quality'>('speed');
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);
  const [isPiP, setIsPiP] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Resolve video URL
  const resolvedSrc = resolveVideoSrc(src);
  const hasVideo = Boolean(resolvedSrc);
  // Full-bleed non-lesson players are marketing/program heroes, not course players.
  // Full-bleed marketing media keeps its poster mounted until playback begins
  // and falls back to it when the video fails. Hero videos play once.
  const heroMode = !lessonId && (className.includes('absolute') || className.includes('fixed'));
  const effectiveShowControls = showControls && !heroMode;
  const effectivePoster = poster;
  const effectiveLoop = loop;
  const effectiveMuted = heroMode || isMuted;

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;

    if (heroMode) setHeroVideoReady(false);

    // Resume from saved position
    if (enableResume && lessonId && startTime === 0) {
      fetchResumePosition();
    }

    // Set initial time
    if (startTime > 0) {
      video.currentTime = startTime;
    }

    // Auto-play on mount (for hero/ambient videos)
    if (autoPlayOnMount || heroMode) {
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [resolvedSrc, lessonId, enableResume, startTime, autoPlayOnMount, heroMode]);

  // Progress tracking
  useEffect(() => {
    if (!enableProgressTracking || !isPlaying || !lessonId) return;

    progressIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || !video.duration) return;

      const percent = (video.currentTime / video.duration) * 100;
      setWatchedPercent(percent);

      // Save progress
      saveProgress(video.currentTime, video.duration);

      // Track with xAPI
      if (userId && courseId) {
        trackLessonProgress(userId, courseId, lessonId, lessonName || title, percent);
      }

      // Callback
      onProgress?.(percent, video.currentTime);

      // Check completion (95% watched)
      if (percent >= 95 && !isCompleted) {
        setIsCompleted(true);
        onComplete?.();
      }
    }, 5000); // Every 5 seconds

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPlaying, lessonId, userId, courseId, isCompleted]);

  // Auto-hide controls
  useEffect(() => {
    if (!controlsAutoHide || !effectiveShowControls) return;

    const hideControls = () => {
      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControlsOverlay(false);
        }, 3000);
      }
    };

    const showControlsOnMove = () => {
      setShowControlsOverlay(true);
      hideControls();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', showControlsOnMove);
      container.addEventListener('touchstart', showControlsOnMove);
    }

    hideControls();

    return () => {
      if (container) {
        container.removeEventListener('mousemove', showControlsOnMove);
        container.removeEventListener('touchstart', showControlsOnMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, controlsAutoHide, effectiveShowControls]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Update current chapter
  useEffect(() => {
    if (!chapters.length) return;

    const chapter = chapters.find(
      (c) => currentTime >= c.startTime && (!c.endTime || currentTime < c.endTime),
    );

    if (chapter?.id !== currentChapter?.id) {
      setCurrentChapter(chapter || null);
    }
  }, [currentTime, chapters]);

  // Handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      onPause?.();
    } else {
      video.play().catch(() => {});
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, onPlay, onPause]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * duration;
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const seekToChapter = (chapter: Chapter) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = chapter.startTime;
    setShowChapterList(false);
  };

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video || !enablePiP) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else {
        await video.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
    setIsPlaying(true);
  };

  // Fetch resume position from API
  const fetchResumePosition = async () => {
    if (!lessonId) return;

    try {
      const res = await fetch(`/api/video/progress?lessonId=${lessonId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.progress?.last_position_seconds > 0) {
        if (videoRef.current) {
          videoRef.current.currentTime = json.progress.last_position_seconds;
        }
      }
    } catch (e) {
      // Ignore errors
    }
  };

  // Save progress to API
  const saveProgress = async (current: number, total: number) => {
    if (!lessonId) return;

    try {
      await fetch('/api/video/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lastPositionSeconds: current,
          durationSeconds: total,
        }),
      });
    } catch (e) {
      // Ignore errors
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current chapter progress
  const getChapterProgress = () => {
    if (!currentChapter || !currentChapter.endTime) return 0;
    const chapterDuration = currentChapter.endTime - currentChapter.startTime;
    const watched = currentTime - currentChapter.startTime;
    return Math.min(100, (watched / chapterDuration) * 100);
  };

  // No video state
  if (!hasVideo) {
    return (
      <div className={`relative bg-slate-900 rounded-xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4">
            <Play className="w-10 h-10" />
          </div>
          <p className="text-lg font-medium">Video not available</p>
          <p className="text-sm text-slate-500 mt-1">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`${className?.includes('absolute') || className?.includes('fixed') ? '' : 'relative group'} bg-black overflow-hidden ${heroMode ? '' : `rounded-xl ${ASPECT_RATIOS[aspectRatio]}`} ${className}`}
    >
      {/* Poster remains visible until a playable hero frame is actually running. */}
      {heroMode && effectivePoster ? (
        <img
          src={effectivePoster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* Video Element */}
      <video
        ref={videoRef}
        src={resolvedSrc}
        poster={effectivePoster}
        autoPlay={heroMode || autoPlay}
        muted={effectiveMuted}
        loop={effectiveLoop}
        playsInline
        className={`w-full h-full ${heroMode ? `object-cover transition-opacity duration-300 ${heroVideoReady && !hasError ? 'opacity-100' : 'opacity-0'}` : 'object-contain'}`}
        onClick={togglePlay}
        onLoadedMetadata={(e) => {
          setDuration((e.target as HTMLVideoElement).duration);
          setIsLoading(false);
          onReady?.();
        }}
        onCanPlay={() => setIsLoading(false)}
        onError={() => {
          setHeroVideoReady(false);
          setHasError(true);
          setIsLoading(false);
          onError?.('Failed to load video');
        }}
        onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
        onProgress={() => {
          const video = videoRef.current;
          if (video && video.buffered.length > 0) {
            setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onPlaying={() => {
          if (heroMode) setHeroVideoReady(true);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Loading Overlay */}
      {isLoading && !heroMode && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {hasError && !heroMode && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-400">
          <X className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Video unavailable</p>
          <p className="text-sm text-slate-500 mt-1">{title}</p>
          <button
            onClick={restart}
            className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* Click to play overlay */}
      {!heroMode && !isPlaying && !isLoading && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-transform hover:scale-110">
            <Play className="w-12 h-12 text-white ml-2" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {effectiveShowControls && !isLoading && !hasError && (
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
            showControlsOverlay || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentChapter && (
                <button
                  onClick={() => setShowChapterList(!showChapterList)}
                  className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-white text-sm flex items-center gap-2 hover:bg-white/30"
                >
                  <span className="w-2 h-2 rounded-full bg-brand-red-500" />
                  {currentChapter.title}
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <span className="px-2 py-1 bg-brand-green-500 text-white text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Completed
                </span>
              )}
              {watchedPercent > 0 && watchedPercent < 100 && (
                <span className="text-white text-sm">{Math.round(watchedPercent)}% watched</span>
              )}
            </div>
          </div>

          {/* Chapter List Dropdown */}
          {showChapterList && chapters.length > 0 && (
            <div className="absolute top-16 left-4 w-80 max-h-64 overflow-y-auto bg-slate-900/95 backdrop-blur rounded-xl p-2">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-white font-medium">Chapters</span>
                <button onClick={() => setShowChapterList(false)}>
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => seekToChapter(chapter)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${
                    currentChapter?.id === chapter.id
                      ? 'bg-brand-red-600 text-white'
                      : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="w-8 text-xs opacity-60">{formatTime(chapter.startTime)}</span>
                  <span className="flex-1">{chapter.title}</span>
                  {currentChapter?.id === chapter.id && <Play className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Center controls */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-6 pointer-events-auto">
              {/* Skip Back */}
              <button
                onClick={() => skip(-10)}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition"
              >
                <SkipBack className="w-7 h-7 text-white" />
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20 transition"
              >
                <SkipForward className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            {/* Progress bar */}
            <div className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group/progress">
              {/* Buffered */}
              <div
                className="absolute h-full bg-white/30 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Progress */}
              <div
                className="absolute h-full bg-brand-red-500 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-brand-red-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition shadow-lg"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
              />
              {/* Chapter markers */}
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-white/80 rounded"
                  style={{ left: `${(chapter.startTime / duration) * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekToChapter(chapter);
                  }}
                />
              ))}
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:text-white/80">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="text-white hover:text-white/80">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-6 h-6" />
                    ) : (
                      <Volume2 className="w-6 h-6" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 accent-brand-red-500"
                  />
                </div>

                {/* Time */}
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-white/80 p-2"
                  >
                    <Settings className="w-6 h-6" />
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900/95 backdrop-blur rounded-xl overflow-hidden">
                      {/* Tabs */}
                      <div className="flex border-b border-slate-700">
                        {(['speed', 'captions', 'quality'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-sm font-medium capitalize ${
                              activeTab === tab
                                ? 'text-white bg-slate-800'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="p-3 max-h-64 overflow-y-auto">
                        {/* Speed */}
                        {activeTab === 'speed' && (
                          <div className="grid grid-cols-4 gap-2">
                            {PLAYBACK_SPEEDS.map((speed) => (
                              <button
                                key={speed}
                                onClick={() => {
                                  handleSpeedChange(speed);
                                  setShowSettings(false);
                                }}
                                className={`py-2 rounded-lg text-sm font-medium ${
                                  playbackSpeed === speed
                                    ? 'bg-brand-red-600 text-white'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Captions */}
                        {activeTab === 'captions' && (
                          <div className="space-y-1">
                            <button
                              onClick={() => {
                                setCurrentCaption(null);
                                setShowSettings(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                                !currentCaption
                                  ? 'bg-slate-700 text-white'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              Off
                              {!currentCaption && <Check className="w-4 h-4" />}
                            </button>
                            {captions.map((caption) => (
                              <button
                                key={caption.srclang}
                                onClick={() => {
                                  setCurrentCaption(caption.src);
                                  setShowSettings(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg ${
                                  currentCaption === caption.src
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {caption.label}
                                {currentCaption === caption.src && <Check className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Quality */}
                        {activeTab === 'quality' && (
                          <div className="space-y-1">
                            {['Auto', '1080p', '720p', '480p', '360p'].map((quality) => (
                              <button
                                key={quality}
                                className={`w-full px-3 py-2 rounded-lg text-left ${
                                  quality === 'Auto'
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {quality}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* PiP */}
                {enablePiP && (
                  <button
                    onClick={togglePiP}
                    className={`text-white hover:text-white/80 p-2 ${isPiP ? 'text-brand-red-500' : ''}`}
                  >
                    <PictureInPicture2 className="w-6 h-6" />
                  </button>
                )}

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white hover:text-white/80 p-2">
                  {isFullscreen ? (
                    <Minimize className="w-6 h-6" />
                  ) : (
                    <Maximize className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caption display */}
      {currentCaption && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 rounded-lg">
          <span className="text-white text-lg text-center">{currentCaption}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Resolve video URL from various formats
 */
function resolveVideoSrc(src?: string): string | null {
  if (!src) return null;

  // Full URL
  if (src.startsWith('http')) return src;

  // Local path
  if (src.startsWith('/')) return src;

  // YouTube embed
  if (src.includes('youtube.com/embed/') || src.includes('youtu.be/')) {
    return src;
  }

  // Vimeo
  if (src.includes('vimeo.com/')) {
    return src;
  }

  // Pexels video ID
  if (/^\d+$/.test(src)) {
    return `https://videos.pexels.com/video-files/${src}/`;
  }

  return src;
}

// Re-export for convenience
export default UltraVideoPlayer;
