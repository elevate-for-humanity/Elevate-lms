'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Shared singleton observer — one for the entire page                */
/* ------------------------------------------------------------------ */

type ObserverCallback = (isIntersecting: boolean) => void;

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new Map<Element, ObserverCallback>();

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = callbacks.get(entry.target);
          if (cb && entry.isIntersecting) {
            cb(true);
            sharedObserver!.unobserve(entry.target);
            callbacks.delete(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
  }
  return sharedObserver;
}

function observe(el: Element, cb: ObserverCallback) {
  callbacks.set(el, cb);
  getSharedObserver().observe(el);
}

function unobserve(el: Element) {
  callbacks.delete(el);
  sharedObserver?.unobserve(el);
}

/* ------------------------------------------------------------------ */
/*  InView component                                                   */
/* ------------------------------------------------------------------ */

interface InViewProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'fade' | 'scale' | 'blur';
  delay?: number;
  duration?: number;
  className?: string;
}

const animations = {
  'fade-up': { hidden: 'translate-y-6 opacity-0', visible: 'translate-y-0 opacity-100' },
  'fade-left': { hidden: '-translate-x-6 opacity-0', visible: 'translate-x-0 opacity-100' },
  'fade-right': { hidden: 'translate-x-6 opacity-0', visible: 'translate-x-0 opacity-100' },
  fade: { hidden: 'opacity-0', visible: 'opacity-100' },
  scale: { hidden: 'scale-95 opacity-0', visible: 'scale-100 opacity-100' },
  blur: { hidden: 'opacity-0 blur-sm', visible: 'opacity-100 blur-0' },
};

export function InView({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  className = '',
}: InViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    observe(el, () => setVisible(true));
    return () => unobserve(el);
  }, []);

  const anim = animations[animation];

  return (
    <div
      ref={ref}
      className={`transition-all ease-out will-change-[transform,opacity] ${visible ? anim.visible : anim.hidden} ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
