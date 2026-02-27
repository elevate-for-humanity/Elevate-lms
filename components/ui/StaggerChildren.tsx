'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StaggerChildrenProps {
  children: ReactNode;
  /** Delay between each child in ms */
  stagger?: number;
  /** Base animation duration per child in ms */
  duration?: number;
  /** Container className */
  className?: string;
}

/**
 * Staggers the entrance of each direct child element when the container
 * scrolls into view. Each child fades up with an incremental delay.
 * Pure CSS transitions — no framer-motion dependency.
 */
export function StaggerChildren({
  children,
  stagger = 100,
  duration = 600,
  className = '',
}: StaggerChildrenProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${i * stagger}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${i * stagger}ms`,
                willChange: 'opacity, transform',
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}
