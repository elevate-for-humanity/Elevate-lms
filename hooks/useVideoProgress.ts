'use client';

import { useEffect, useRef, RefObject } from 'react';

type UseVideoProgressOptions = {
  lessonId?: string | number;
  /**
   * User or enrollment identity to namespace the storage key.
   * Without this, two users on the same device share resume state.
   * Pass the authenticated user's ID or enrollment ID.
   */
  userId?: string;
  /** Fraction of video watched before marking complete (default: 0.8) */
  threshold?: number;
  /** How often to persist resume position to localStorage, in seconds (default: 5) */
  saveIntervalSeconds?: number;
};

/**
 * Storage key includes both userId and lessonId to prevent cross-user
 * contamination on shared devices and admin testing accounts.
 */
const storageKey = (lessonId: string | number, userId?: string) =>
  userId ? `video_resume_${userId}_${lessonId}` : `video_resume_${lessonId}`;

/**
 * Attaches progress tracking to a video element via ref.
 *
 * - Restores playback position from localStorage on mount.
 * - Saves position every `saveIntervalSeconds` and on unmount.
 * - Reports completion to /api/progress once the watch threshold is reached.
 */
export function useVideoProgress(
  ref: RefObject<HTMLVideoElement>,
  { lessonId, userId, threshold = 0.8, saveIntervalSeconds = 5 }: UseVideoProgressOptions = {}
) {
  const hasReportedComplete = useRef(false);
  const lastSavedTime = useRef(0);

  // Restore resume position once the video metadata is ready.
  useEffect(() => {
    const video = ref.current;
    if (!video || !lessonId) return;

    const restorePosition = () => {
      try {
        const saved = localStorage.getItem(storageKey(lessonId, userId));
        if (saved) {
          const savedTime = parseFloat(saved);
          // Only restore if there is meaningful progress and the video is longer
          // than the saved position (guards against stale data from a re-cut video).
          if (
            !isNaN(savedTime) &&
            savedTime > 2 &&
            video.duration > 0 &&
            savedTime < video.duration - 2
          ) {
            video.currentTime = savedTime;
          }
        }
      } catch {
        // localStorage unavailable (private browsing, storage quota) — ignore
      }
    };

    if (video.readyState >= 1) {
      restorePosition();
    } else {
      video.addEventListener('loadedmetadata', restorePosition, { once: true });
      return () => video.removeEventListener('loadedmetadata', restorePosition);
    }
  }, [ref, lessonId, userId]);

  // Save position periodically and report completion.
  useEffect(() => {
    const video = ref.current;
    if (!video || !lessonId) return;

    hasReportedComplete.current = false;
    lastSavedTime.current = 0;

    const savePosition = (time: number) => {
      try {
        localStorage.setItem(storageKey(lessonId, userId), String(time));
        lastSavedTime.current = time;
      } catch {
        // ignore
      }
    };

    const clearPosition = () => {
      try {
        localStorage.removeItem(storageKey(lessonId, userId));
      } catch {
        // ignore
      }
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      const current = video.currentTime;

      // Throttle localStorage writes
      if (current - lastSavedTime.current >= saveIntervalSeconds) {
        savePosition(current);
      }

      // Completion reporting
      const progress = current / video.duration;
      if (progress >= threshold && !hasReportedComplete.current) {
        hasReportedComplete.current = true;

        fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonId,
            duration: video.duration,
            watchedSeconds: current,
            completed: true,
          }),
        }).catch(() => {
          // Don't break video playback on network errors
        });
      }
    };

    // When the video ends, clear the resume position so it restarts next time.
    const handleEnded = () => {
      clearPosition();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      // Persist final position on unmount (e.g. navigating away mid-lesson)
      if (video.currentTime > 2 && !hasReportedComplete.current) {
        savePosition(video.currentTime);
      }
    };
  }, [ref, lessonId, userId, threshold, saveIntervalSeconds]);
}
