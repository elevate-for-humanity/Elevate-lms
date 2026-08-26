'use client';

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      tabIndex={0}
      className="skip-to-main fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-md transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-600"
    >
      Skip to main content
    </a>
  );
}
