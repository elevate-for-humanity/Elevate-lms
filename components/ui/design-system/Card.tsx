import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * CARD COMPONENT - 10/10
 *
 * One Card component with consistent rules.
 * No custom cards on pages.
 *
 * Rules:
 * - Radius: rounded-card (16px)
 * - Border: subtle and consistent
 * - Shadow: consistent (or none)
 * - Padding: p-6 (desktop), p-4 (mobile)
 */

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const variantClasses = {
  default: 'bg-white border border-slate-200',
  bordered: 'bg-white border-2 border-slate-300',
  elevated: 'bg-white shadow-card hover:shadow-card-hover',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-4 md:p-6',
  lg: 'p-6 md:p-8',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className,
  onClick,
}: CardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={cn(
        'rounded-card transition-all duration-200',
        variantClasses[variant],
        paddingClasses[padding],
        onClick && 'cursor-pointer hover:border-brand-blue-600',
        className
      )}
    >
      {children}
    </Component>
  );
}
