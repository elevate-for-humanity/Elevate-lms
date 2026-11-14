'use client';

import { useEffect, useRef, useState } from 'react';
import React from 'react';

export function useLazyLoad<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        ...options,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

export function LazyComponent({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>();

  return React.createElement('div', { ref }, isVisible ? children : fallback);
}
