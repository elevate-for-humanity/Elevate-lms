'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface AutoPlayTTSProps {
  text: string;
  voice?: string;
  delay?: number;
}

function isIOS() {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export default function AutoPlayTTS({ text, voice, delay = 1500 }: AutoPlayTTSProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const playTTS = useCallback(() => {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    clearKeepAlive();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const requested = voice
      ? voices.find((candidate) => candidate.name === voice && candidate.lang.startsWith('en'))
      : null;
    const preferredNames = [
      'Google US English',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Zira - English (United States)',
      'Samantha',
    ];
    const selected =
      requested ??
      preferredNames.reduce<SpeechSynthesisVoice | null>(
        (found, name) => found ?? voices.find((candidate) => candidate.name === name) ?? null,
        null,
      ) ??
      voices.find((candidate) => candidate.lang === 'en-US') ??
      voices.find((candidate) => candidate.lang.startsWith('en')) ??
      null;

    if (selected) utterance.voice = selected;

    const finish = () => {
      clearKeepAlive();
      setHasPlayed(true);
      setShowPlayButton(false);
    };

    utterance.onstart = () => {
      setHasPlayed(true);
      setShowPlayButton(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    // Some Chromium builds may stop long utterances. Resume periodically without
    // replacing the global onvoiceschanged handler or creating duplicate timers.
    keepAliveRef.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearKeepAlive();
        return;
      }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);

    window.speechSynthesis.speak(utterance);
  }, [clearKeepAlive, text, voice]);

  useEffect(() => {
    if (hasPlayed || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const synth = window.speechSynthesis;
    const loadVoices = () => synth.getVoices();
    loadVoices();
    synth.addEventListener('voiceschanged', loadVoices);

    const ios = isIOS();
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (ios) {
      const handleInteraction = () => playTTS();
      document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
      document.addEventListener('click', handleInteraction, { once: true });
      timer = setTimeout(() => setShowPlayButton(true), delay);

      return () => {
        if (timer) clearTimeout(timer);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
        synth.removeEventListener('voiceschanged', loadVoices);
        synth.cancel();
        clearKeepAlive();
      };
    }

    timer = setTimeout(() => {
      if (synth.getVoices().length > 0) playTTS();
      else {
        const speakWhenReady = () => {
          synth.removeEventListener('voiceschanged', speakWhenReady);
          playTTS();
        };
        synth.addEventListener('voiceschanged', speakWhenReady, { once: true });
      }
    }, delay);

    return () => {
      if (timer) clearTimeout(timer);
      synth.removeEventListener('voiceschanged', loadVoices);
      synth.cancel();
      clearKeepAlive();
    };
  }, [clearKeepAlive, delay, hasPlayed, playTTS, text]);

  if (!showPlayButton || hasPlayed) return null;

  return (
    <button
      type="button"
      onClick={playTTS}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[9000] flex min-h-11 min-w-11 items-center justify-center rounded-full bg-brand-blue-700 p-3 text-white shadow-lg hover:bg-brand-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-700 sm:bottom-6 sm:right-6"
      aria-label="Play page narration"
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 5v14l11-7z" />
      </svg>
    </button>
  );
}
