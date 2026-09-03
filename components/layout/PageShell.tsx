import { ReactNode } from 'react';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  maxWidth?: '6xl' | '7xl';
  background?: 'white' | 'slate';
}

export function PageShell({
  children,
  className = '',
  maxWidth = '7xl',
  background = 'white',
}: PageShellProps) {
  const bgClass = background === 'white' ? 'bg-white' : 'bg-slate-50';
  const maxWidthClass = maxWidth === '6xl' ? 'max-w-6xl' : 'max-w-7xl';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 ${className}`}>
        {children}
      </div>
    </div>
  );
}
