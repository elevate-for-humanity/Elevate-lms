'use client';

import { useId, useState, useSyncExternalStore, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

const DESKTOP_QUERY = '(min-width: 768px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(DESKTOP_QUERY).matches;
}

// Server rendering and no-JavaScript browsing retain the complete content.
function getServerSnapshot() {
  return true;
}

export function ResponsiveDetails({
  title,
  children,
  className = '',
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const id = useId();
  const desktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [expanded, setExpanded] = useState(defaultOpen);
  const visible = desktop || expanded;

  return (
    <div className={className} data-responsive-details>
      <h3 className="text-base font-bold text-slate-950">
        <span className="hidden md:block">{title}</span>
        <button type="button" aria-expanded={visible} aria-controls={id} onClick={() => setExpanded((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-700 md:hidden">
          {title}
          <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none ${visible ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      <div id={id} hidden={!visible} className="responsive-details-panel pt-3">{children}</div>
    </div>
  );
}
