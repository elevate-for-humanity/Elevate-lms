'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export function useTheoryTimeclock(courseId: string, lessonId: string, enabled = true) {
  const [theoryStatus, setTheoryStatus] = useState<'starting' | 'active' | 'paused' | 'untracked'>(
    'paused',
  );
  const [theoryMessage, setTheoryMessage] = useState(
    'Start the Theory Timeclock before studying. Theory time and OJL cannot overlap.',
  );
  const clockRequested = useRef(false);
  const [weeklyTheorySeconds, setWeeklyTheorySeconds] = useState(0);
  const theorySessionId = useRef<string | null>(null);
  const lastActivityAt = useRef(Date.now());
  const startingTheorySession = useRef(false);

  const startTheorySession = useCallback(async () => {
    if (!enabled || startingTheorySession.current || theorySessionId.current || document.hidden) return;
    startingTheorySession.current = true;
    setTheoryStatus('starting');
    try {
      const response = await fetch('/api/theory/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', courseId, lessonId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setTheoryStatus('paused');
        setTheoryMessage(data.error || 'Theory tracking is paused.');
        return;
      }
      if (!data.tracked) {
        setTheoryStatus('untracked');
        setTheoryMessage('Standard course progress tracking is active.');
        return;
      }
      theorySessionId.current = data.sessionId;
      setWeeklyTheorySeconds(Number(data.weeklyActiveSeconds || 0));
      setTheoryStatus('active');
      setTheoryMessage('Active lesson time is being recorded for RTI review.');
    } catch {
      setTheoryStatus('paused');
      setTheoryMessage('Theory timeclock could not start. Please try again.');
    } finally {
      startingTheorySession.current = false;
    }
  }, [courseId, lessonId, enabled]);

  const stopTheorySession = useCallback(async (creditFinal = false) => {
    const sessionId = theorySessionId.current;
    if (!sessionId) return;
    theorySessionId.current = null;
    const response = await fetch('/api/theory/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', sessionId, creditFinal }),
      keepalive: true,
    });
    if (!response.ok) {
      theorySessionId.current = sessionId;
      throw new Error('Theory timeclock could not be stopped. Please try again.');
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const noteActivity = () => {
      lastActivityAt.current = Date.now();
      if (clockRequested.current && !theorySessionId.current && !document.hidden)
        void startTheorySession();
    };
    const videoActivity = (event: Event) => {
      const video = event.target;
      if (
        clockRequested.current &&
        !document.hidden &&
        video instanceof HTMLVideoElement &&
        !video.paused &&
        !video.seeking
      )
        noteActivity();
    };
    const handleVisibility = () => {
      if (document.hidden) {
        void stopTheorySession(true).catch(() =>
          setTheoryMessage('Theory timeclock could not be finalized. Please retry Stop.'),
        );
        setTheoryStatus((status) => (status === 'untracked' ? status : 'paused'));
        setTheoryMessage('Theory tracking paused while this lesson is not visible.');
      } else {
        lastActivityAt.current = Date.now();
        if (clockRequested.current) void startTheorySession();
      }
    };
    const activityEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
    ];
    activityEvents.forEach((event) =>
      window.addEventListener(event, noteActivity, { passive: true }),
    );
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('timeupdate', videoActivity, true);

    const heartbeat = window.setInterval(async () => {
      const sessionId = theorySessionId.current;
      if (!sessionId || document.hidden) return;
      if (Date.now() - lastActivityAt.current > 90_000) {
        void stopTheorySession(false).catch(() =>
          setTheoryMessage('Theory timeclock could not be finalized. Please retry Stop.'),
        );
        setTheoryStatus('paused');
        setTheoryMessage(
          'Theory tracking paused after inactivity. Interact with the lesson to resume.',
        );
        return;
      }
      const response = await fetch('/api/theory/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', sessionId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.status !== 'active') {
        clockRequested.current = false;
        theorySessionId.current = null;
        setTheoryStatus('paused');
        setTheoryMessage(data.message || data.error || 'Theory tracking is paused.');
        return;
      }
      setWeeklyTheorySeconds(Number(data.weeklyActiveSeconds || 0));
    }, 60_000);

    return () => {
      window.clearInterval(heartbeat);
      activityEvents.forEach((event) => window.removeEventListener(event, noteActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('timeupdate', videoActivity, true);
      void stopTheorySession(true).catch(() => undefined);
    };
  }, [startTheorySession, stopTheorySession, enabled]);
  return {
    theoryStatus,
    theoryMessage,
    weeklyTheorySeconds,
    startClock() {
      if (!enabled) return;
      clockRequested.current = true;
      lastActivityAt.current = Date.now();
      void startTheorySession();
    },
    async stopClock() {
      clockRequested.current = false;
      try {
        await stopTheorySession(true);
        setTheoryStatus('paused');
        setTheoryMessage(
          'Theory timeclock stopped. Recorded active time remains available for RTI review.',
        );
      } catch (error) {
        setTheoryMessage(
          error instanceof Error ? error.message : 'Theory timeclock could not stop. Please retry.',
        );
      }
    },
    async finalize() {
      if (!enabled) return;
      clockRequested.current = false;
      await stopTheorySession(true);
      if (theoryStatus !== 'untracked') {
        setTheoryStatus('paused');
        setTheoryMessage(
          'Theory timeclock stopped. If the lesson needs more study, start the clock again before continuing.',
        );
      }
    },
  };
}
