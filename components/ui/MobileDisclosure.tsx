'use client';

import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { ChevronDown } from 'lucide-react';

/** Real, keyboard-operable details. Content is present in server HTML and opens
 * by default without JS; phones collapse it after hydration, desktops expand it.
 * User toggles are respected until the viewport crosses the mobile breakpoint. */
export function MobileDisclosure({ title, children, icon, className = '' }: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setOpen(!mobile.matches);
    syncViewport();
    mobile.addEventListener('change', syncViewport);
    return () => mobile.removeEventListener('change', syncViewport);
  }, []);

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    setOpen(event.currentTarget.open);
  };

  return (
    <details open={open} onToggle={handleToggle} className={`mobile-reading-details rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 ${className}`}>
      <summary className="flex items-center gap-3 font-bold text-slate-950">
        {icon ? <span className="shrink-0 text-brand-blue-800" aria-hidden="true">{icon}</span> : null}
        <h3 className="min-w-0 flex-1 text-base font-bold">{title}</h3>
        <ChevronDown className="mobile-reading-chevron h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
      </summary>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </details>
  );
}
