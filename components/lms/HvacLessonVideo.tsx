'use client';

/**
 * HvacLessonVideo
 *
 * Plays HVAC lesson media in priority order:
 *   1. /generated/videos/lesson-{uuid}.mp4  — D-ID talking-head (mouth moves, lesson audio)
 *   2. /generated/lessons/lesson-{uuid}.mp3 — lesson voiceover synced to muted avatar video
 *   3. brollVideoUrl                         — b-roll fallback (no lesson audio)
 *
 * For case 2, the avatar video (/videos/avatars/trades-guide.mp4) plays muted
 * and loops while the lesson-specific MP3 plays on top. The instructor is
 * visible on screen for every lesson without requiring D-ID regeneration.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LessonPlayer from '@/components/lms/LessonPlayer';
import { HVAC_LESSON_UUID } from '@/lib/courses/hvac-uuids';

const AVATAR_VIDEO = '/videos/avatars/trades-guide.mp4';

interface Props {
  lessonDefId: string;
  brollVideoUrl: string;
  lessonTitle: string;
  /** Assembled lesson video from DB — checked first before local paths */
  dbVideoUrl?: string;
  onProgress?: (percent: number) => void;
  onComplete?: () => void;
}

type MediaMode = 'mp4' | 'mp3+avatar' | 'broll' | null;

export default function HvacLessonVideo({
  lessonDefId,
  brollVideoUrl,
  lessonTitle,
  dbVideoUrl,
  onProgress,
  onComplete,
}: Props) {
  const [mode, setMode] = useState<MediaMode>(null);
  const [mp3Url, setMp3Url] = useState<string>('');
  const [mp4Url, setMp4Url] = useState<string>('');

  // Refs for the synchronized avatar+audio player
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ended, setEnded] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    // Priority 1: assembled V16 video from DB (mobile-safe H.264 baseline)
    if (dbVideoUrl) {
      fetch(dbVideoUrl, { method: 'HEAD' })
        .then(r => {
          if (r.ok) {
            setMp4Url(dbVideoUrl);
            setMode('mp4');
          } else {
            checkLocalPaths();
          }
        })
        .catch(() => checkLocalPaths());
      return;
    }
    checkLocalPaths();

    function checkLocalPaths() {
      const uuid = HVAC_LESSON_UUID[lessonDefId];
      if (!uuid) {
        setMode('broll');
        return;
      }

      const videoPath = `/generated/videos/lesson-${uuid}.mp4`;
      const audioPath = `/generated/lessons/lesson-${uuid}.mp3`;

      fetch(videoPath, { method: 'HEAD' })
        .then(r => {
          if (r.ok) {
            setMp4Url(videoPath);
            setMode('mp4');
            return;
          }
          return fetch(audioPath, { method: 'HEAD' })
            .then(r2 => {
              if (r2.ok) {
                setMp3Url(audioPath);
                setMode('mp3+avatar');
              } else {
                setMode('broll');
              }
            })
            .catch(() => setMode('broll'));
        })
        .catch(() => {
          fetch(audioPath, { method: 'HEAD' })
            .then(r => {
              if (r.ok) {
                setMp3Url(audioPath);
                setMode('mp3+avatar');
              } else {
                setMode('broll');
              }
            })
            .catch(() => setMode('broll'));
        });
    }
  }, [lessonDefId, dbVideoUrl]);

  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    const aud = audioRef.current;
    if (!vid || !aud) return;

    if (isPlaying) {
      vid.pause();
      aud.pause();
      setIsPlaying(false);
    } else {
      if (ended) {
        aud.currentTime = 0;
        vid.currentTime = 0;
        setEnded(false);
      }
      vid.play().catch(() => {});
      aud.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, ended]);

  const handleAudioTimeUpdate = useCallback(() => {
    const aud = audioRef.current;
    if (!aud) return;
    setCurrentTime(aud.currentTime);
    const pct = aud.duration > 0 ? (aud.currentTime / aud.duration) * 100 : 0;
    onProgress?.(pct);
    if (pct >= 90) onComplete?.();
  }, [onProgress, onComplete]);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setEnded(true);
    onProgress?.(100);
    onComplete?.();
  }, [onProgress, onComplete]);

  const handleAudioLoaded = useCallback(() => {
    setDuration(audioRef.current?.duration ?? 0);
    setAudioReady(true);
  }, []);

  const handleVideoLoaded = useCallback(() => {
    setVideoReady(true);
  }, []);

  const seek = useCallback((seconds: number) => {
    const aud = audioRef.current;
    if (!aud) return;
    aud.currentTime = Math.max(0, Math.min(aud.duration, aud.currentTime + seconds));
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (mode === null) return null;

  if (mode === 'mp4') {
    return (
      <LessonPlayer
        videoUrl={mp4Url}
        lessonTitle={lessonTitle}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
  }

  if (mode === 'broll') {
    return (
      <LessonPlayer
        videoUrl={brollVideoUrl}
        lessonTitle={lessonTitle}
        onProgress={onProgress}
        onComplete={onComplete}
      />
    );
  }

  // mp3+avatar: muted looping avatar video + lesson-specific audio
  const ready = audioReady && videoReady;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={AVATAR_VIDEO}
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={handleVideoLoaded}
          className="w-full h-full object-cover"
        />

        <audio
          ref={audioRef}
          src={mp3Url}
          preload="auto"
          onLoadedMetadata={handleAudioLoaded}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleAudioEnded}
          className="hidden"
        />

        {!isPlaying && !ended && (
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ready}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors"
            aria-label="Play lesson"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <svg className="h-7 w-7 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}

        {ended && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-colors"
            aria-label="Replay lesson"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </button>
        )}
      </div>

      <div className="bg-slate-900 px-4 py-3 space-y-2">
        <div
          className="w-full bg-white/10 rounded-full h-1.5 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const aud = audioRef.current;
            if (aud && aud.duration) aud.currentTime = pct * aud.duration;
          }}
        >
          <div
            className="bg-brand-blue-500 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => seek(-10)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Back 10 seconds">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              disabled={!ready}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blue-600 text-white hover:bg-brand-blue-500 disabled:opacity-40"
              aria-label={ended ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
            >
              {ended ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : isPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button type="button" onClick={() => seek(10)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Forward 10 seconds">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            <span className="text-xs text-white/50 ml-1 truncate max-w-[200px]">{lessonTitle}</span>
          </div>

          <span className="text-xs tabular-nums text-white/50">
            {fmt(currentTime)} / {duration > 0 ? fmt(duration) : '--:--'}
          </span>
        </div>
      </div>

      {ended && (
        <div className="bg-slate-900 px-4 pb-3">
          <div className="flex items-center gap-2 rounded-lg bg-brand-green-600/20 px-3 py-2 text-sm text-brand-green-400">
            ✅ Lesson complete
          </div>
        </div>
      )}
    </div>
  );
}
