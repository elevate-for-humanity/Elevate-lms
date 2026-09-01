'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

const SCROLL_SETTLE_MS = 140;

function narrationFor(section: HTMLElement) {
  const supplied = section.dataset.narration?.trim();
  if (supplied) return supplied;

  const heading = section.querySelector<HTMLElement>('h1, h2, h3');
  const paragraphs = Array.from(section.querySelectorAll<HTMLElement>('p')).slice(0, 2);
  const benefits = Array.from(section.querySelectorAll<HTMLElement>('li')).slice(0, 4);
  const actions = Array.from(section.querySelectorAll<HTMLElement>('a, button'))
    .map((item) => item.innerText.trim())
    .filter(Boolean)
    .slice(0, 2);
  return [
    heading?.innerText,
    ...paragraphs.map((item) => item.innerText),
    benefits.length ? `Key benefits: ${benefits.map((item) => item.innerText).join('. ')}` : '',
    actions.length ? `Next steps: ${actions.join(' or ')}.` : '',
  ]
    .filter(Boolean)
    .join('. ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1800);
}

function mostVisiblePageSection() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('main section, main > [data-scroll-narration]'),
  ).filter((section) => section.dataset.narrationDisabled !== 'true');
  let best: { section: HTMLElement; visibleRatio: number } | null = null;

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    const visibleHeight = Math.max(
      0,
      Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
    );
    const visibleRatio =
      rect.height > 0 ? visibleHeight / Math.min(rect.height, window.innerHeight) : 0;
    if (!best || visibleRatio > best.visibleRatio) best = { section, visibleRatio };
  }

  return best && best.visibleRatio >= 0.35 ? best.section : null;
}

export function ScrollNarrator() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const lastNarrationRef = useRef<{ section: HTMLElement; text: string } | null>(null);
  const timerRef = useRef<number | null>(null);
  const { play, prepare, stop, isLoading, isPlaying } = useNaturalVoice();

  const narrateVisibleSection = useCallback(async () => {
    const section = mostVisiblePageSection();
    if (!section || isPlaying || isLoading) return;

    const text = narrationFor(section);
    if (!text) return;
    if (lastNarrationRef.current?.section === section && lastNarrationRef.current.text === text)
      return;

    lastNarrationRef.current = { section, text };
    const started = await play(text, {
      voice: 'coral',
      style: 'instructor',
      rate: 1,
    });
    if (!started) {
      lastNarrationRef.current = null;
      setNotice('Read aloud is unavailable in this browser.');
    }
  }, [isLoading, isPlaying, play]);

  useEffect(() => {
    lastNarrationRef.current = null;
    stop();
  }, [pathname, stop]);

  useEffect(() => {
    if (!enabled) return;
    const section = mostVisiblePageSection();
    if (!section) return;
    const text = narrationFor(section);
    if (text) void prepare(text, { voice: 'coral', style: 'instructor', rate: 1 });
  }, [enabled, pathname, prepare]);

  useEffect(() => {
    if (!enabled) {
      lastNarrationRef.current = null;
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

    const activateFromUserGesture = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      void narrateVisibleSection();
    };

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
    if (isPlaying || isLoading) {
      setEnabled(false);
      stop();
      return;
    }
    setEnabled(true);
    lastNarrationRef.current = null;
    void narrateVisibleSection();
  };

  return (
    <div className="fixed bottom-24 left-4 z-[80] sm:bottom-6 sm:left-6">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={enabled}
        aria-label={
          enabled
            ? isLoading
              ? 'Natural narration is preparing. Tap to stop.'
              : isPlaying
                ? 'Stop page narration'
                : 'Page narration is active on scroll. Tap to turn it off.'
            : 'Turn on page narration'
        }
        title={enabled ? 'Guided page narration on' : 'Guided page narration off'}
        className={`inline-flex h-12 w-12 min-h-0 min-w-0 touch-manipulation items-center justify-center rounded-full border-2 border-white p-0 text-white shadow-xl transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${
          enabled ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-blue-700 hover:bg-blue-800'
        }`}
        style={{ minHeight: '3rem', minWidth: '3rem', padding: 0 }}
      >
        {isPlaying || isLoading ? (
          <VolumeX className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        )}
        <span className="sr-only">
          {enabled
            ? isLoading
              ? 'Preparing narration'
              : isPlaying
                ? 'Stop narration'
                : 'Narration on'
            : 'Narration off'}
        </span>
      </button>
      {notice ? (
        <p
          role="status"
          className="mt-2 max-w-64 rounded-lg bg-white p-2 text-xs font-bold text-red-800 shadow-lg"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
