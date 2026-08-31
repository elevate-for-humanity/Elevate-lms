'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

const SCROLL_SETTLE_MS = 250;

function narrationFor(section: HTMLElement) {
  const supplied = section.dataset.narration?.trim();
  if (supplied) return supplied;

  const heading = section.querySelector<HTMLElement>('h1, h2');
  const paragraph = section.querySelector<HTMLElement>('p');
  return [heading?.innerText, paragraph?.innerText]
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1200);
}

function mostVisibleHomepageSection() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('main > section, main > [data-scroll-narration]'),
  );
  let best: { section: HTMLElement; visibleRatio: number } | null = null;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
    const visibleRatio = rect.height > 0 ? visibleHeight / Math.min(rect.height, window.innerHeight) : 0;
    if (!best || visibleRatio > best.visibleRatio) best = { section, visibleRatio };
  }

  return best && best.visibleRatio >= 0.35 ? best.section : null;
}

export function ScrollNarrator() {
  const [enabled, setEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const lastSectionRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const {
    play,
    stop,
    isLoading,
    isPlaying,
  } = useNaturalVoice();

  const narrateVisibleSection = useCallback(async () => {
    const section = mostVisibleHomepageSection();
    if (!section || section === lastSectionRef.current) return;

    const text = narrationFor(section);
    if (!text) return;

    lastSectionRef.current = section;
    stop();
    const started = await play(text, {
      voice: 'coral',
      style: 'instructor',
      rate: 1,
    });
    if (!started) setNotice('Read aloud is unavailable in this browser.');
  }, [play, stop]);

  useEffect(() => {
    if (!enabled) {
      lastSectionRef.current = null;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      stop();
      return;
    }

    const scheduleNarration = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void narrateVisibleSection();
      }, SCROLL_SETTLE_MS);
    };

    const activateFromUserGesture = () => scheduleNarration();

    scheduleNarration();
    window.addEventListener('scroll', scheduleNarration, { passive: true });
    window.addEventListener('wheel', activateFromUserGesture, { passive: true });
    window.addEventListener('touchstart', activateFromUserGesture, { passive: true });
    window.addEventListener('pointerdown', activateFromUserGesture, { passive: true });
    window.addEventListener('keydown', activateFromUserGesture);
    window.addEventListener('resize', scheduleNarration);

    return () => {
      window.removeEventListener('scroll', scheduleNarration);
      window.removeEventListener('wheel', activateFromUserGesture);
      window.removeEventListener('touchstart', activateFromUserGesture);
      window.removeEventListener('pointerdown', activateFromUserGesture);
      window.removeEventListener('keydown', activateFromUserGesture);
      window.removeEventListener('resize', scheduleNarration);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, narrateVisibleSection, stop]);

  const toggle = () => {
    setNotice(null);
    setEnabled((current) => !current);
  };

  return (
    <div className="fixed bottom-24 left-4 z-[80] sm:bottom-6 sm:left-6">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        className={`inline-flex min-h-14 min-w-[12.5rem] touch-manipulation items-center justify-center gap-3 rounded-full border-2 border-white px-6 py-4 text-base font-black text-white shadow-2xl transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
          enabled ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-700 hover:bg-blue-800'
        }`}
      >
        {enabled ? <VolumeX className="h-6 w-6" aria-hidden="true" /> : <Volume2 className="h-6 w-6" aria-hidden="true" />}
        {enabled ? (isLoading ? 'Preparing audio…' : isPlaying ? 'Stop reading' : 'Reading on scroll') : 'Read page aloud'}
      </button>
      {notice ? <p role="status" className="mt-2 max-w-64 rounded-lg bg-white p-2 text-xs font-bold text-red-800 shadow-lg">{notice}</p> : null}
    </div>
  );
}
