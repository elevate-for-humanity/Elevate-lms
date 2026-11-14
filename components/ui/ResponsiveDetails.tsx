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
// Compact at first paint; native details remain usable before JavaScript loads.
function getServerSnapshot() {
  return false;
}

export function ResponsiveDetails({
  title, children, className = '', defaultOpen = false,
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
    <details className={className} data-responsive-details open={visible}
      onToggle={(event) => {
        if (!desktop) setExpanded(event.currentTarget.open);
      }}>
      <summary aria-controls={id} onClick={(event) => {
        if (desktop) event.preventDefault();
      }} className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-left text-base font-bold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-red-700 md:cursor-default">
        <h3>{title}</h3>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform motion-reduce:transition-none md:hidden ${visible ? 'rotate-180' : ''}`} />
      </summary>
      <div id={id} className="responsive-details-panel pt-3">{children}</div>
    </details>
  );
}
