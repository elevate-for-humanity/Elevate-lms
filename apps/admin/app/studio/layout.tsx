import type { ReactNode } from 'react';
import StudioNavigation from './StudioNavigation.client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <section className="min-w-0 bg-slate-50" aria-label="Dev Studio">
      <StudioNavigation />
      <div className="min-w-0 overflow-x-hidden">{children}</div>
    </section>
  );
}
