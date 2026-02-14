import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * BUTTON COMPONENT - 10/10
 *
 * One Button component, 3 variants max.
 * No custom one-offs on pages.
 *
 * Variants:
 * - primary: Solid background
 * - secondary: Outline
 * - tertiary: Link style
 */

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variantClasses = {
  primary: 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 shadow-button',
  secondary:
    'bg-white text-black border-2 border-slate-300 hover:border-slate-400',
  tertiary: 'text-brand-blue-600 hover:text-brand-blue-700 hover:underline',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  className,
  type = 'button',
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-button transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variantClasses[variant],
    variant !== 'tertiary' && sizeClasses[size],
    className
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={baseClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {children}
    </button>
  );
}
