"use client";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed left-4 top-4 z-50 rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-md focus:outline-none focus:ring-2 focus:ring-brand-orange-500"
    >
      Skip to main content
    </a>
  );
}
