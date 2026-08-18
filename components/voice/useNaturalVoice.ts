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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(async (text: string, options: PlayOptions = {}) => {
    const clean = text.trim();
    if (!clean) return false;

    stop();
    setError(null);

    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setError('Voice playback is not supported in this browser.');
      options.onError?.();
      return false;
    }

    setIsLoading(true);
    const utterance = new SpeechSynthesisUtterance(clean);
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
  }, [stop]);

  const pause = useCallback(() => {
    if (utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(async () => {
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
