'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NaturalVoiceStyle = 'default' | 'assistant' | 'instructor' | 'commercial';

type PlayOptions = {
  voice?: string;
  style?: NaturalVoiceStyle;
  rate?: number;
};

export function useNaturalVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const browserSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
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
    if (typeof window !== 'undefined' && browserSpeechRef.current) {
      window.speechSynthesis.cancel();
      browserSpeechRef.current = null;
    }
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
        throw new Error(payload?.error || 'Natural voice is temporarily unavailable.');
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
        releaseObjectUrl();
      };
      audio.onerror = () => {
        setIsLoading(false);
        setIsPlaying(false);
        setIsPaused(false);
        setError('Natural voice playback failed.');
        releaseObjectUrl();
      };
      audioRef.current = audio;

      await audio.play();
      return true;
    } catch (cause) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = Math.min(2, Math.max(0.5, options.rate || 1));
        utterance.onstart = () => {
          setIsLoading(false);
          setIsPlaying(true);
          setIsPaused(false);
          setError(null);
        };
        utterance.onend = () => {
          browserSpeechRef.current = null;
          setIsPlaying(false);
          setIsPaused(false);
        };
        utterance.onerror = () => {
          browserSpeechRef.current = null;
          setIsLoading(false);
          setIsPlaying(false);
          setIsPaused(false);
          setError('Natural voice and browser narration are temporarily unavailable.');
        };
        browserSpeechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        return true;
      }
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      setError(cause instanceof Error ? cause.message : 'Natural voice is temporarily unavailable.');
      releaseObjectUrl();
      return false;
    }
  }, [releaseObjectUrl, stop]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    audio.pause();
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      await audio.play();
      return true;
    } catch {
      setError('Natural voice playback could not resume.');
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
