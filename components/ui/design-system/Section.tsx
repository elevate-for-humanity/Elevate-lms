import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Container } from './Container';

/**
 * SECTION COMPONENT - 10/10
 *
 * This single component eliminates spacing drift.
 *
 * Rules:
 * - Default padding: py-16 (desktop), py-10 (mobile)
 * - Consistent max-width container
 * - Optional full-bleed
 * - Optional background variant
 */

interface SectionProps {
  children: ReactNode;
  variant?: 'white' | 'slate' | 'blue' | 'green' | 'orange';
  fullBleed?: boolean;
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  noPadding?: boolean;
  className?: string;
}

const variantClasses = {
  white: 'bg-white',
  slate: 'bg-slate-50',
  blue: 'bg-brand-blue-50',
  green: 'bg-green-50',
  orange: 'bg-orange-50',
};

export function Section({
  children,
  variant = 'white',
  fullBleed = false,
  containerSize = 'lg',
  noPadding = false,
  className,
}: SectionProps) {
  const content = fullBleed ? (
    children
  ) : (
    <Container size={containerSize}>{children}</Container>
  );

  return (
    <section
      className={cn(
        variantClasses[variant],
        !noPadding && 'py-10 md:py-16',
        className
      )}
    >
      {content}
    </section>
  );
}
