'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NaturalVoiceStyle = 'default' | 'assistant' | 'instructor' | 'commercial';

type PlayOptions = {
  voice?: string;
  style?: NaturalVoiceStyle;
  rate?: number;
  onEnded?: () => void;
  onError?: () => void;
};

export function useNaturalVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const releaseObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        // Audio metadata may not be available yet.
      }
      audio.src = '';
    }
    audioRef.current = null;
    releaseObjectUrl();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [releaseObjectUrl]);

  const play = useCallback(async (text: string, options: PlayOptions = {}) => {
    const clean = text.trim();
    if (!clean) return false;

    stop();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/voice/natural', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: clean,
          voice: options.voice || 'coral',
          style: options.style || 'default',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Voice is temporarily unavailable.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;

      const audio = new Audio(objectUrl);
      audio.preload = 'auto';
      audio.playbackRate = Math.min(2, Math.max(0.5, options.rate || 1));
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };
      audio.onpause = () => {
        if (!audio.ended) {
          setIsPlaying(false);
          setIsPaused(audio.currentTime > 0);
        }
      };
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        audioRef.current = null;
        releaseObjectUrl();
        options.onEnded?.();
      };
      audio.onerror = () => {
        audioRef.current = null;
        releaseObjectUrl();
        setIsLoading(false);
        setIsPlaying(false);
        setIsPaused(false);
        setError('Voice playback failed.');
        options.onError?.();
      };
      audioRef.current = audio;

      await audio.play();
      return true;
    } catch (cause) {
      audioRef.current = null;
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      setError(cause instanceof Error ? cause.message : 'Voice is temporarily unavailable.');
      releaseObjectUrl();
      options.onError?.();
      return false;
    }
  }, [releaseObjectUrl, stop]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) audio.pause();
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      return true;
    } catch {
      setError('Voice playback could not resume.');
      return false;
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  return {
    play,
    pause,
    resume,
    stop,
    isLoading,
    isPlaying,
    isPaused,
    error,
  };
}
