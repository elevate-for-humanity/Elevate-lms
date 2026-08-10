'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

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

export default function AutoPlayTTS({ text, voice = 'coral', delay = 1500 }: AutoPlayTTSProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const { play, isLoading, error } = useNaturalVoice();

  const playTTS = useCallback(async () => {
    if (!text.trim()) return;
    const ok = await play(text, { voice, style: 'instructor', rate: 1 });
    if (ok) {
      setHasPlayed(true);
      setShowPlayButton(false);
    } else {
      setShowPlayButton(true);
    }
  }, [play, text, voice]);

  useEffect(() => {
    if (hasPlayed || !text.trim() || typeof window === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    if (isIOS()) {
      const handleInteraction = () => void playTTS();
      document.addEventListener('touchstart', handleInteraction, { once: true, passive: true });
      document.addEventListener('click', handleInteraction, { once: true });
      timer = setTimeout(() => setShowPlayButton(true), delay);

      return () => {
        if (timer) clearTimeout(timer);
        document.removeEventListener('touchstart', handleInteraction);
        document.removeEventListener('click', handleInteraction);
      };
    }

    timer = setTimeout(() => {
      void playTTS();
    }, delay);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [delay, hasPlayed, playTTS, text]);

  if ((!showPlayButton && !error) || hasPlayed) return null;

  return (
    <button
      type="button"
      onClick={() => void playTTS()}
      disabled={isLoading}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[9000] flex min-h-11 min-w-11 items-center justify-center rounded-full bg-brand-blue-700 p-3 text-white shadow-lg hover:bg-brand-blue-800 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue-700 sm:bottom-6 sm:right-6"
      aria-label="Play natural page narration"
      title={error || 'Play natural page narration'}
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
