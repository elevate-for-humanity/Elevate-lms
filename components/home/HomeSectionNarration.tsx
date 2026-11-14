'use client';

import { useEffect, useRef } from 'react';
import { HOME_INTRODUCTIONS } from '@/content/home-introductions';
import recordings from '@/content/home-introduction-recordings.json';

export default function HomeSectionNarration({
  section,
}: {
  section: keyof typeof HOME_INTRODUCTIONS;
}) {
  const marker = useRef<HTMLSpanElement>(null);
  const text = HOME_INTRODUCTIONS[section];
  const recording = (recordings as Record<string, { text: string; src: string }>)[section];
  const source = recording?.text === text ? recording.src : undefined;

  useEffect(() => {
    const surface = marker.current?.closest('section');
    if (!surface) return;
    const attributes = {
      'data-scroll-narration': '',
      'data-narration': text,
      'data-narration-style': 'commercial',
      'data-narration-src': source ?? '',
    };
    const previous = Object.fromEntries(Object.keys(attributes).map(key => [key, surface.getAttribute(key)]));
    Object.entries(attributes).forEach(([key, value]) => surface.setAttribute(key, value));
    return () => {
      Object.entries(previous).forEach(([key, value]) => {
        if (value === null) surface.removeAttribute(key);
        else surface.setAttribute(key, value);
      });
    };
  }, [text, source]);

  return <span ref={marker} className="sr-only">{text}</span>;
}
