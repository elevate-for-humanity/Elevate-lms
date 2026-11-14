'use client';

export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-orange-600 focus:text-white focus:rounded-lg"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}
