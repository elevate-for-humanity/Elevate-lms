'use client';
import { ReactNode } from 'react';
import { ScrollReveal } from './ScrollReveal';

interface StaggeredRevealProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
}

export function StaggeredReveal({
  children,
  staggerDelay = 100,
  className = '',
  direction = 'up',
}: StaggeredRevealProps) {
  return (
    <>
      {children.map((child, index) => (
        <ScrollReveal
          key={index}
          delay={index * staggerDelay}
          direction={direction}
          className={className}
        >
          {child}
        </ScrollReveal>
      ))}
    </>
  );
}
