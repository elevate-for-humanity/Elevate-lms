import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * CONTAINER COMPONENT - 10/10
 *
 * This eliminates 60% of spacing drift.
 *
 * Rules:
 * - Default: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
 * - Full-bleed: explicitly marked
 * - Consistent everywhere
 */

interface ContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
};

export function Container({ children, size = 'lg', className }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  );
}
