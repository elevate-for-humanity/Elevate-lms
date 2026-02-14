import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  size?: 'narrow' | 'default' | 'wide' | 'full';
  className?: string;
}

/**
 * Consistent container component for all pages
 * Matches SkilledUS design with standardized widths
 */
export function Container({
  children,
  size = 'default',
  className = ''
}: ContainerProps) {
  const widths = {
    narrow: 'max-w-4xl',   // 896px - for text-heavy content
    default: 'max-w-6xl',  // 1152px - standard sections (matches SkilledUS)
    wide: 'max-w-7xl',     // 1280px - wide sections
    full: 'max-w-none'     // Full width
  };

  return (
    <div className={`${widths[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section wrapper with consistent vertical spacing
 */
export function Section({
  children,
  className = '',
  background = 'white'
}: {
  children: React.ReactNode;
  className?: string;
  background?: 'white' | 'gray' | 'blue';
}) {
  const backgrounds = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    blue: 'bg-brand-blue-50'
  };

  return (
    <section className={`py-12 md:py-16 ${backgrounds[background]} ${className}`}>
      {children}
    </section>
  );
}
