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

function chooseBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  return (
    voices.find((voice) => /natural|neural|premium|enhanced/i.test(voice.name) && /^en(-|_)/i.test(voice.lang)) ||
    voices.find((voice) => /^en-US$/i.test(voice.lang)) ||
    voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

export function useNaturalVoice() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
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

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;

    releaseObjectUrl();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [releaseObjectUrl]);

  const playBrowserFallback = useCallback((text: string, options: PlayOptions) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const browserVoice = chooseBrowserVoice();
    if (browserVoice) utterance.voice = browserVoice;
    utterance.lang = browserVoice?.lang || 'en-US';
    utterance.rate = Math.min(2, Math.max(0.5, options.rate || 1));
    utterance.pitch = options.style === 'commercial' ? 1.02 : 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);
    };
    utterance.onend = () => {
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      options.onEnded?.();
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoading(false);
      setError('Voice playback failed.');
      options.onError?.();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

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
        const fallbackStarted = playBrowserFallback(clean, options);
        if (fallbackStarted) return true;
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
        const fallbackStarted = playBrowserFallback(clean, options);
        if (!fallbackStarted) {
          setIsLoading(false);
          setIsPlaying(false);
          setIsPaused(false);
          setError('Voice playback failed.');
          options.onError?.();
        }
      };
      audioRef.current = audio;

      await audio.play();
      return true;
    } catch (cause) {
      audioRef.current = null;
      releaseObjectUrl();

      const fallbackStarted = playBrowserFallback(clean, options);
      if (fallbackStarted) return true;

      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      setError(cause instanceof Error ? cause.message : 'Voice is temporarily unavailable.');
      options.onError?.();
      return false;
    }
  }, [playBrowserFallback, releaseObjectUrl, stop]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      return;
    }
    if (utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(async () => {
    const audio = audioRef.current;
    if (audio) {
      try {
        await audio.play();
        return true;
      } catch {
        setError('Voice playback could not resume.');
        return false;
      }
    }

    if (utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return true;
    }

    return false;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    return () => stop();
  }, [stop]);

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
