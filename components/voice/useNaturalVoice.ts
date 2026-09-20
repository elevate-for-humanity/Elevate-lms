'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type NaturalVoiceStyle = 'default' | 'assistant' | 'instructor' | 'commercial';

type PlayOptions = {
  src?: string;
  voice?: string;
  style?: NaturalVoiceStyle;
  rate?: number;
  /** Only true for a visible speed control chosen by the learner. */
  userControlledRate?: boolean;
  onEnded?: () => void;
  onError?: () => void;
  allowBrowserFallback?: boolean;
};

const naturalVoiceCache = new Map<string, Promise<Blob>>();
const NATURAL_VOICE_STOP_EVENT = 'elevate:natural-voice-stop';

const DELIVERY_RATE_BY_STYLE: Record<NaturalVoiceStyle, number> = {
  default: 1,
  assistant: 0.98,
  instructor: 0.95,
  commercial: 1,
};

/**
 * Keep every automatic voice on the platform within an understandable range.
 * A learner can still deliberately choose a faster rate from an exposed speed
 * control; page authors and generated experiences cannot accidentally race.
 */
export function narrationPlaybackRate(options: PlayOptions = {}) {
  const requested = Number(options.rate);
  if (options.userControlledRate && Number.isFinite(requested)) {
    return Math.min(1.5, Math.max(0.75, requested));
  }

  const style = options.style || 'default';
  const baseline = DELIVERY_RATE_BY_STYLE[style];
  return Number.isFinite(requested)
    ? Math.min(1.08, Math.max(0.92, requested))
    : baseline;
}

/** Stops every natural-voice hook instance, including audio created on another page section. */
export function stopAllNaturalVoicePlayback() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NATURAL_VOICE_STOP_EVENT));
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function naturalVoiceCacheKey(text: string, options: PlayOptions) {
  return JSON.stringify([
    text,
    options.voice || 'coral',
    options.style || 'default',
    narrationPlaybackRate(options),
    options.src || '',
  ]);
}

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

async function requestNaturalVoiceBlob(text: string, options: PlayOptions): Promise<Blob> {
  const key = naturalVoiceCacheKey(text, options);
  const cached = naturalVoiceCache.get(key);
  if (cached) return cached;

  const source = options.src?.trim();
  if (source && !source.startsWith('/')) {
    throw new Error('Natural voice media must use a same-origin path.');
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  const request = fetch(source || '/api/voice/natural', {
      ...(source
        ? { method: 'GET' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
            body: JSON.stringify({
              text,
              voice: options.voice || 'coral',
              style: options.style || 'default',
              rate: narrationPlaybackRate(options),
            }),
          }),
      cache: source ? 'force-cache' : 'no-store',
      signal: controller.signal,
    })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Natural voice request failed (${response.status})`);
      const blob = await response.blob();
      if (!blob.size) throw new Error('Natural voice returned empty audio.');
      return blob;
    })
    .catch((error) => {
      naturalVoiceCache.delete(key);
      throw error;
    })
    .finally(() => window.clearTimeout(timeout));

  naturalVoiceCache.set(key, request);
  return request;
}

async function requestNaturalVoice(text: string, options: PlayOptions): Promise<HTMLAudioElement> {
  const blob = await requestNaturalVoiceBlob(text, options);
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.playbackRate = narrationPlaybackRate(options);
  const release = () => URL.revokeObjectURL(url);
  audio.addEventListener('ended', release, { once: true });
  audio.addEventListener('error', release, { once: true });
  return audio;
}

function browserFallback(text: string, options: PlayOptions): SpeechSynthesisUtterance | null {
  if (
    typeof window === 'undefined' ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) return null;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const browserVoice = chooseBrowserVoice();
  if (browserVoice) utterance.voice = browserVoice;
  utterance.lang = browserVoice?.lang || 'en-US';
  utterance.rate = narrationPlaybackRate(options);
  utterance.pitch = options.style === 'commercial' || options.style === 'assistant' ? 1.02 : 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

/**
 * Natural-TTS-first compatibility helper for non-hook callers.
 * Browser speech is used only when the shared natural voice endpoint is unavailable.
 */
export async function speakNaturalVoice(text: string, options: PlayOptions = {}): Promise<boolean> {
  const clean = text.trim().slice(0, 2400);
  if (!clean || typeof window === 'undefined') return false;

  try {
    const audio = await requestNaturalVoice(clean, options);
    await audio.play();
    return true;
  } catch {
    if (options.allowBrowserFallback === false) return false;
    const utterance = browserFallback(clean, options);
    return Boolean(utterance);
  }
}

export function useNaturalVoice() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTokenRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    playbackTokenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoading(false);
  }, []);

  const play = useCallback(async (text: string, options: PlayOptions = {}) => {
    const clean = text.trim().slice(0, 2400);
    if (!clean) return false;

    stopAllNaturalVoicePlayback();
    const playbackToken = playbackTokenRef.current;
    setError(null);
    setIsLoading(true);

    try {
      const audio = await requestNaturalVoice(clean, options);
      if (playbackToken !== playbackTokenRef.current) {
        audio.pause();
        return false;
      }
      audioRef.current = audio;
      audio.onplay = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };
      audio.onended = () => {
        audioRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        options.onEnded?.();
      };
      audio.onerror = () => {
        audioRef.current = null;
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoading(false);
        setError('Natural voice playback failed.');
        options.onError?.();
      };
      await audio.play();
      return true;
    } catch {
      if (playbackToken !== playbackTokenRef.current) return false;
      if (options.allowBrowserFallback === false) {
        setIsLoading(false);
        setError('Natural voice is temporarily unavailable.');
        options.onError?.();
        return false;
      }
      const utterance = browserFallback(clean, options);
      if (!utterance) {
        setIsLoading(false);
        setError('Voice playback is not supported in this browser.');
        options.onError?.();
        return false;
      }

      utteranceRef.current = utterance;
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
      return true;
    }
  }, [stop]);

  const prepare = useCallback(async (text: string, options: PlayOptions = {}) => {
    const clean = text.trim().slice(0, 2400);
    if (!clean || typeof window === 'undefined') return false;
    try {
      await requestNaturalVoiceBlob(clean, options);
      return true;
    } catch {
      return false;
    }
  }, []);

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
    const handleGlobalStop = () => stop();
    window.addEventListener(NATURAL_VOICE_STOP_EVENT, handleGlobalStop);
    if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
    return () => {
      window.removeEventListener(NATURAL_VOICE_STOP_EVENT, handleGlobalStop);
      stop();
    };
  }, [stop]);

  return {
    play,
    prepare,
    pause,
    resume,
    stop,
    isLoading,
    isPlaying,
    isPaused,
    error,
  };
}
