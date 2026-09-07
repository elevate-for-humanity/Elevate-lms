'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useNaturalVoice } from '@/components/voice/useNaturalVoice';

function narrationFor(section: HTMLElement) {
  return section.dataset.narration?.replace(/\s+/g, ' ').trim().slice(0, 900) ?? '';
}

function narrationSourceFor(section: HTMLElement) {
  return section.dataset.narrationSrc?.trim() || undefined;
}

function mostVisiblePageSection() {
  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('main [data-scroll-narration]'),
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
  const [enabled, setEnabled] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const lastNarrationRef = useRef<{ section: HTMLElement; text: string; source?: string } | null>(
    null,
  );
  const { play, prepare, stop, isLoading, isPlaying } = useNaturalVoice();

  const narrateVisibleSection = useCallback(async () => {
    const section = mostVisiblePageSection();
    if (!section) {
      // A section owns its narration only while it is visibly dominant. Stop
      // at section boundaries so speech from one area can never overlap the
      // next area or continue after the visitor has scrolled away.
      lastNarrationRef.current = null;
      stop();
      return;
    }

    const text = narrationFor(section);
    if (!text) return;
    const source = narrationSourceFor(section);
    if (
      lastNarrationRef.current?.section === section &&
      lastNarrationRef.current.text === text &&
      lastNarrationRef.current.source === source
    )
      return;

    lastNarrationRef.current = { section, text, source };
    const started = await play(text, {
      src: source,
      voice: 'coral',
      style: 'assistant',
      rate: 0.98,
      allowBrowserFallback: false,
    });
    if (!started) {
      lastNarrationRef.current = null;
      setNotice('Natural narration is temporarily unavailable.');
    }
  }, [play, stop]);

  useEffect(() => {
    lastNarrationRef.current = null;
    stop();
  }, [pathname, stop]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('main [data-scroll-narration]'),
    ).filter((section) => section.dataset.narrationDisabled !== 'true');

    const preload = (section: HTMLElement) => {
      const text = narrationFor(section);
      if (text)
        void prepare(text, {
          src: narrationSourceFor(section),
          voice: 'coral',
          style: 'assistant',
          rate: 0.98,
          allowBrowserFallback: false,
        });
    };

    // Warm the opening experience immediately. A section may become dominant
    // before an observer callback runs on fast mobile scrolls.
    sections.slice(0, 3).forEach(preload);

    if (!('IntersectionObserver' in window)) {
      sections.slice(0, 2).forEach(preload);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          preload(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '85% 0px', threshold: 0.01 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname, prepare]);

  useEffect(() => {
    let frame = 0;
    const stopNarrationAfterLeavingSection = () => {
      if (!lastNarrationRef.current || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const current = lastNarrationRef.current?.section;
        if (!current || mostVisiblePageSection() === current) return;
        lastNarrationRef.current = null;
        stop();
        setEnabled(false);
      });
    };

    window.addEventListener('scroll', stopNarrationAfterLeavingSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', stopNarrationAfterLeavingSection);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [stop]);

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

  // The Bookkeeping hero is a dense, full-width informational graphic. Keep
  // the floating narrator from covering its instructor, benefits, or pathway copy.
  if (pathname === '/programs/bookkeeping') return null;

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
                : 'Play narration for this section'
            : 'Play narration for this section'
        }
        title={isPlaying || isLoading ? 'Stop narration' : 'Play section narration'}
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
                : 'Play narration'
            : 'Play narration'}
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
