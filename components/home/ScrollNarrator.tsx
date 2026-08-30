'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

const SCROLL_SETTLE_MS = 500;

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
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
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
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const lastSectionRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const voice = useNaturalVoice();

  const narrateVisibleSection = useCallback(async () => {
    const section = mostVisibleHomepageSection();
    if (!section || section === lastSectionRef.current) return;

    const text = narrationFor(section);
    if (!text) return;

    lastSectionRef.current = section;
    const started = await voice.play(text, {
      voice: 'coral',
      style: 'instructor',
      rate: 1,
    });
    if (!started) setNotice('Read aloud is unavailable in this browser.');
  }, [voice]);

  useEffect(() => {
    if (!enabled) {
      lastSectionRef.current = null;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      voice.stop();
      return;
    }

    const scheduleNarration = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        void narrateVisibleSection();
      }, SCROLL_SETTLE_MS);
    };

    scheduleNarration();
    window.addEventListener('scroll', scheduleNarration, { passive: true });
    window.addEventListener('resize', scheduleNarration);

    return () => {
      window.removeEventListener('scroll', scheduleNarration);
      window.removeEventListener('resize', scheduleNarration);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [enabled, narrateVisibleSection, voice]);

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
        className={`inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-black text-white shadow-xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
          enabled ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-700 hover:bg-blue-800'
        }`}
      >
        {enabled ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
        {enabled ? 'Stop reading' : 'Read page aloud'}
      </button>
      {notice ? <p role="status" className="mt-2 max-w-64 rounded-lg bg-white p-2 text-xs font-bold text-red-800 shadow-lg">{notice}</p> : null}
    </div>
  );
}
