/**
 * useActivityCompletion
 *
 * Tracks real completion of gating activities — not just tab visits.
 *
 * Video:   completed when ≥80% of duration has been watched (fires onVideoProgress)
 * Reading: completed when the reading container has been scrolled to within
 *          100px of the bottom (fires onReadingScroll)
 * Others:  completed immediately on first visit (tab click)
 *
 * Returns:
 *   completed     — Set<ActivityId> of activities that are truly done
 *   markCompleted — manually mark an activity complete (for quiz pass, lab submit, etc.)
 *   onVideoProgress — attach to video timeupdate/progress events
 *   onReadingScroll — attach to reading container's onScroll
 */

import { useState, useCallback, useRef } from 'react';
import type { ActivityId } from './activity-map';

interface UseActivityCompletionResult {
  completed: Set<ActivityId>;
  markCompleted: (id: ActivityId) => void;
  onVideoProgress: (currentTime: number, duration: number) => void;
  onReadingScroll: (e: React.UIEvent<HTMLElement>) => void;
}

const VIDEO_THRESHOLD = 0.8; // 80% watched = complete
const READING_BOTTOM_PX = 120; // within 120px of bottom = complete

export function useActivityCompletion(
  initialCompleted: Set<ActivityId> = new Set(),
): UseActivityCompletionResult {
  const [completed, setCompleted] = useState<Set<ActivityId>>(initialCompleted);
  const videoMaxRef = useRef(0); // track furthest point watched (skip-proof)

  const markCompleted = useCallback((id: ActivityId) => {
    setCompleted((prev) => {
      if (prev.has(id)) return prev;
      return new Set([...prev, id]);
    });
  }, []);

  const onVideoProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!duration || duration < 1) return;
      // Track furthest point to prevent scrubbing to end
      if (currentTime > videoMaxRef.current) {
        videoMaxRef.current = currentTime;
      }
      if (videoMaxRef.current / duration >= VIDEO_THRESHOLD) {
        markCompleted('video');
      }
    },
    [markCompleted],
  );

  const onReadingScroll = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= READING_BOTTOM_PX) {
        markCompleted('reading');
      }
    },
    [markCompleted],
  );

  return { completed, markCompleted, onVideoProgress, onReadingScroll };
}
