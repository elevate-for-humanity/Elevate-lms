"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  BookOpen,
  SkipForward,
  SkipBack,
} from "lucide-react";

interface LessonPlayerProps {
  videoUrl: string;
  lessonTitle: string;
  moduleTitle?: string;
  transcript?: string | null;
  lessonContent?: string | null;
  lessonNumber?: number;
  totalLessons?: number;
  durationMinutes?: number;
  captionUrl?: string | null;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

export default function LessonPlayer({
  videoUrl,
  lessonTitle,
  moduleTitle,
  lessonNumber,
  totalLessons,
  durationMinutes,
  captionUrl,
  onProgress,
  onComplete,
}: LessonPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [ended, setEnded] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);
  const hideControlsTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWatchedRef = React.useRef(0); // Track furthest point watched

  // Use direct Supabase URL — CSP media-src allows it, CORS is open
  const mediaSrc = videoUrl;
  const isAudioOnly = /\.(mp3|wav|ogg|aac|m4a)(\?|$)/i.test(videoUrl);

  // Detect mobile for adaptive preload strategy
  const isMobile = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  }, []);

  // Video event listeners
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onPlay = () => { setIsPlaying(true); setHasStarted(true); setIsLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setEnded(true); onComplete?.(); };
    const onTimeUpdate = () => {
      setCurrentTime(v.currentTime);
      // Track the furthest point watched (no skipping ahead)
      if (v.currentTime > maxWatchedRef.current) {
        maxWatchedRef.current = v.currentTime;
      }
      if (v.duration && onProgress) onProgress((maxWatchedRef.current / v.duration) * 100);
    };
    const onSeeking = () => {
      // Prevent seeking past max watched point + small buffer
      if (v.currentTime > maxWatchedRef.current + 2) {
        v.currentTime = maxWatchedRef.current;
      }
    };
    const onLoaded = () => {
      if (v.duration && !isNaN(v.duration)) setDuration(v.duration);
      setIsLoading(false);
    };
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onPlaying = () => setIsLoading(false);
    const onStalled = () => setIsLoading(true);
    const onError = () => { setIsLoading(false); setHasError(true); };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("stalled", onStalled);
    v.addEventListener("error", onError);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("stalled", onStalled);
      v.removeEventListener("error", onError);
    };
  }, [onComplete, onProgress]);

  // Fullscreen listener
  React.useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-hide controls after 3s of no mouse movement during playback
  const resetControlsTimer = React.useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    if (!isPlaying) setShowControls(true);
    else resetControlsTimer();
    return () => { if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current); };
  }, [isPlaying, resetControlsTimer]);

  const play = async () => {
    const v = videoRef.current;
    if (!v) return;
    setIsLoading(true);
    setHasStarted(true);
    try {
      await v.play();
    } catch (e) {
      // Autoplay blocked — user will need to tap again
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) await play();
    else v.pause();
  };

  const restart = async () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setEnded(false);
    await play();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  };

  const skip = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    const target = v.currentTime + seconds;
    // Allow rewind freely, but forward only up to max watched
    v.currentTime = Math.max(0, Math.min(maxWatchedRef.current + 2, target));
  };

  const seekFromEvent = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    target: HTMLDivElement,
  ) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const rect = target.getBoundingClientRect();
    const clientX =
      "touches" in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    v.currentTime = pct * duration;
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => seekFromEvent(e, e.currentTarget);
  const [isSeeking, setIsSeeking] = React.useState(false);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => { setIsSeeking(true); seekFromEvent(e, e.currentTarget); };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => { if (isSeeking) seekFromEvent(e, e.currentTarget); };
  const onTouchEnd = () => setIsSeeking(false);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullscreen();
          break;
        case "ArrowLeft":
          skip(-10);
          break;
        case "ArrowRight":
          skip(10);
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div ref={containerRef} className="w-full" onMouseMove={resetControlsTimer}>
      {/* Video container with 16:9 aspect ratio */}
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
        <div className="relative aspect-video">
          {/* Actual video element — metadata-only preload for fast initial render */}
          <video
            ref={videoRef}
            preload={isAudioOnly ? "auto" : "metadata"}
            playsInline
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-contain bg-black"
            onClick={togglePlay}
          >
            <source src={mediaSrc} type={isAudioOnly ? "audio/mpeg" : "video/mp4"} />
            {captionUrl && (
              <track
                kind="captions"
                src={captionUrl}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>

          {/* Audio-only visual: show lesson info instead of black screen */}
          {isAudioOnly && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Volume2 className="w-10 h-10 text-white/70" />
              </div>
              <p className="text-white/90 font-semibold text-lg text-center px-4">{lessonTitle}</p>
              {moduleTitle && <p className="text-white/50 text-sm mt-1">{moduleTitle}</p>}
              <p className="text-white/40 text-xs mt-3">Audio Lesson</p>
            </div>
          )}

          {/* Loading / buffering indicator */}
          {isLoading && hasStarted && !ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
              <div className="h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="mt-3 text-xs text-white/60 sm:text-sm">Buffering...</p>
            </div>
          )}

          {/* Error state */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
              <div className="mb-4 rounded-full bg-brand-red-500/20 p-4">
                <svg className="h-8 w-8 text-brand-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-white/70">Video could not be loaded</p>
              <button
                type="button"
                onClick={() => { setHasError(false); videoRef.current?.load(); }}
                className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                Retry
              </button>
            </div>
          )}

          {/* Pre-start overlay */}
          {!hasStarted && !hasError && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 cursor-pointer"
              onClick={play}
            >
              {/* Top bar */}
              <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 backdrop-blur-sm sm:h-8 sm:w-8">
                    <BookOpen className="h-3.5 w-3.5 text-white sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    {moduleTitle && (
                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/50 sm:text-xs">
                        {moduleTitle}
                      </p>
                    )}
                    <p className="text-xs font-medium text-white/70 sm:text-sm">
                      {lessonNumber && totalLessons ? `Lesson ${lessonNumber} of ${totalLessons}` : "Lesson"}
                    </p>
                  </div>
                </div>
                {durationMinutes && (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/60 backdrop-blur-sm sm:text-xs">
                    {durationMinutes} min
                  </span>
                )}
              </div>

              <h2 className="mb-3 max-w-lg text-center text-xl font-bold text-white sm:text-3xl md:text-4xl px-4">
                {lessonTitle}
              </h2>
              {moduleTitle && (
                <p className="mb-8 text-sm text-white/50 sm:text-base">{moduleTitle}</p>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); play(); }}
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue-600 text-white shadow-lg shadow-brand-blue-600/30 transition hover:scale-105 hover:bg-brand-blue-500 hover:shadow-xl sm:h-20 sm:w-20"
                aria-label="Play video"
              >
                <Play className="ml-1 h-7 w-7 sm:h-8 sm:w-8" />
              </button>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-white/40 sm:text-sm">
                <Volume2 className="h-3.5 w-3.5" />
                Make sure your volume is on
              </p>
            </div>
          )}

          {/* End card overlay */}
          {ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div className="mb-4 text-5xl text-brand-green-400">&#10003;</div>
              <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">Lesson Complete</h2>
              <p className="mb-6 text-sm text-white/50">{lessonTitle}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); restart(); }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <RotateCcw className="h-4 w-4" />
                Replay
              </button>
            </div>
          )}

          {/* Controls overlay — shown on hover/tap */}
          {hasStarted && !ended && (
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-2 pt-10 transition-opacity duration-300 sm:px-5 sm:pb-3 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress bar */}
              <div
                className="group mb-2 flex cursor-pointer items-center py-1"
                onClick={seek}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                role="slider"
                aria-valuenow={Math.round(progressPct)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Video progress"
                tabIndex={0}
              >
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/20 transition-all group-hover:h-1.5">
                  <div
                    className="h-full rounded-full bg-brand-blue-500 transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-3">
                  {/* Play/Pause */}
                  <button type="button" onClick={ended ? restart : togglePlay} className="rounded-full p-1.5 text-white/80 transition hover:bg-white/10 hover:text-white" aria-label={isPlaying ? "Pause" : "Play"}>
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
                  </button>

                  {/* Skip back 10s */}
                  <button type="button" onClick={() => skip(-10)} className="hidden rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:block" aria-label="Back 10 seconds">
                    <SkipBack className="h-4 w-4" />
                  </button>

                  {/* Skip forward 10s */}
                  <button type="button" onClick={() => skip(10)} className="hidden rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white sm:block" aria-label="Forward 10 seconds">
                    <SkipForward className="h-4 w-4" />
                  </button>

                  {/* Mute */}
                  <button type="button" onClick={toggleMute} className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label={muted ? "Unmute" : "Mute"}>
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>

                  {/* Time */}
                  <span className="ml-1 text-xs tabular-nums text-white/50">
                    {fmt(currentTime)} / {duration > 0 ? fmt(duration) : "--:--"}
                  </span>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-1">
                  {lessonNumber && totalLessons && (
                    <span className="mr-2 hidden text-xs text-white/40 sm:inline">
                      Lesson {lessonNumber}/{totalLessons}
                    </span>
                  )}
                  <button type="button" onClick={toggleFullscreen} className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white" aria-label="Fullscreen">
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
