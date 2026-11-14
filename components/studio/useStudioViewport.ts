'use client';

import { useEffect, useState, type CSSProperties } from 'react';

// On phones, the visual viewport shrinks when the software keyboard opens.
// Resize the existing workspace without remounting its conversation or browser.
export function useStudioViewport(): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.innerWidth >= 1024) {
        setStyle(undefined);
        return;
      }
      // Let the browser handle pinch zoom; don't resize around magnified content.
      if (viewport && viewport.scale !== 1) return;
      setStyle({
        position: 'fixed',
        top: viewport?.offsetTop ?? 0,
        left: 0,
        right: 0,
        height: viewport?.height ?? window.innerHeight,
        zIndex: 80,
      });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('resize', schedule);
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
    };
  }, []);
  return style;
}
