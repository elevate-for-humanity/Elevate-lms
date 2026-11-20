'use client';

import { useEffect, useState, type CSSProperties } from 'react';

// On phones, the visual viewport shrinks when the software keyboard opens.
// Resize the existing workspace without remounting its conversation or browser.
export function useStudioViewport(enabled = true): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties>();
  useEffect(() => {
    if (!enabled) return;
    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Let the browser handle pinch zoom without shifting the app shell.
      if (viewport && viewport.scale !== 1) return;
      if (
        window.innerWidth >= 1024 &&
        (!viewport || (viewport.height >= window.innerHeight && viewport.offsetTop === 0))
      ) {
        setStyle(undefined);
        return;
      }
      // Size the shell once. Its children share the resulting space in their
      // existing layout even when the keyboard shrinks or pans the viewport.
      setStyle({
        height: viewport?.height ?? window.innerHeight,
        top: viewport?.offsetTop ?? 0,
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
  }, [enabled]);
  return enabled ? style : undefined;
}
