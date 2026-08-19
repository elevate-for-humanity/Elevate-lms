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
  const audioUrlRef = useRef<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanupAudio();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [cleanupAudio]);

  const playBrowserFallback = useCallback((text: string, options: PlayOptions) => {
    if (
      typeof window === 'undefined' ||
      !('speechSynthesis' in window) ||
      typeof SpeechSynthesisUtterance === 'undefined'
    ) {
      setError('Voice playback is not supported in this browser.');
      setIsLoading(false);
      options.onError?.();
      return false;
    }

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
    const clean = text.trim().slice(0, 2400);
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

      if (!response.ok) throw new Error(`Natural voice request failed with ${response.status}`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('Natural voice returned empty audio');

      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audio.playbackRate = Math.min(2, Math.max(0.5, options.rate || 1));
      audioRef.current = audio;

      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };
      audio.onended = () => {
        cleanupAudio();
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        options.onEnded?.();
      };
      audio.onerror = () => {
        cleanupAudio();
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        setError('Natural voice playback failed.');
        options.onError?.();
      };

      await audio.play();
      return true;
    } catch {
      cleanupAudio();
      setError('Natural voice is unavailable; using the browser voice fallback.');
      return playBrowserFallback(clean, options);
    }
  }, [cleanupAudio, playBrowserFallback, stop]);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsPaused(true);
      return;
    }
    if (utteranceRef.current && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(async () => {
    if (audioRef.current && audioRef.current.paused) {
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return true;
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
