import type { ReactNode } from 'react';
import StudioNavigation from './StudioNavigation.client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden bg-slate-50" aria-label="Dev Studio">
      <StudioNavigation />
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}
