"use client";

import React from 'react';
import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  threshold?: number;
  className?: string;
}

export function CountUp({
  end,
  start = 0,
  duration = 2000,
  suffix = '',
  prefix = '',
  decimals = 0,
  threshold = 0.5,
  className = '',
}: CountUpProps) {
  const [count, setCount] = useState(end); // Start with end value for SSR
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>();

  const easeOutQuart = (t: number): number => {
    return 1 - Math.pow(1 - t, 4);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          setCount(start); // Reset to start value before animating

          const startTime = performance.now();
          const range = end - start;

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const current = start + range * easedProgress;

            setCount(current);

            if (progress < 1) {
              frameRef.current = requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          frameRef.current = requestAnimationFrame(animate);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      observer.disconnect();
    };
  }, [end, start, duration, threshold, hasAnimated]);

  const formatNumber = (num: number): string => {
    return num.toFixed(decimals);
  };

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(count)}
      {suffix}
    </span>
  );
}
