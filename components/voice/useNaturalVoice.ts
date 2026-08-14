'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NaturalVoiceStyle = 'default' | 'assistant' | 'instructor' | 'commercial';

type PlayOptions = {
  voice?: string;
  style?: NaturalVoiceStyle;
  rate?: number;
};

function pickBrowserVoice(style: NaturalVoiceStyle): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  const pool = english.length ? english : voices;
  const preferred = style === 'commercial'
    ? ['Samantha', 'Ava', 'Google US English', 'Microsoft Jenny', 'Microsoft Aria']
    : style === 'instructor'
      ? ['Samantha', 'Google US English', 'Microsoft Jenny', 'Microsoft Aria']
      : ['Google US English', 'Samantha', 'Microsoft Jenny', 'Microsoft Aria'];

  for (const name of preferred) {
    const match = pool.find((voice) => voice.name.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }

  return pool.find((voice) => voice.default) || pool[0] || null;
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
    utteranceRef.current = null;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    releaseObjectUrl();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, [releaseObjectUrl]);

  const playBrowserVoice = useCallback((text: string, options: PlayOptions = {}) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(2, Math.max(0.5, options.rate || 1));
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = pickBrowserVoice(options.style || 'default');
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setIsPaused(false);
      setError(null);
    };
    utterance.onpause = () => {
      setIsPlaying(false);
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      setError('Voice playback is unavailable on this device.');
      utteranceRef.current = null;
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
        const fallbackWorked = playBrowserVoice(clean, options);
        if (fallbackWorked) return true;
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
        releaseObjectUrl();
      };
      audio.onerror = () => {
        releaseObjectUrl();
        if (!playBrowserVoice(clean, options)) {
          setIsLoading(false);
          setIsPlaying(false);
          setIsPaused(false);
          setError('Voice playback failed.');
        }
      };
      audioRef.current = audio;

      try {
        await audio.play();
        return true;
      } catch {
        releaseObjectUrl();
        audioRef.current = null;
        if (playBrowserVoice(clean, options)) return true;
        throw new Error('Voice playback could not start.');
      }
    } catch (cause) {
      if (playBrowserVoice(clean, options)) return true;
      setIsLoading(false);
      setIsPlaying(false);
      setIsPaused(false);
      setError(cause instanceof Error ? cause.message : 'Voice is temporarily unavailable.');
      releaseObjectUrl();
      return false;
    }
  }, [playBrowserVoice, releaseObjectUrl, stop]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
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
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      return true;
    }
    return false;
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
