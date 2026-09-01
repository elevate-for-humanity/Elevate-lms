import type { ReactNode } from 'react';
import { getAvailableWorkspaces } from '@/lib/devstudio/workspace-registry';
import StudioNavigation from './StudioNavigation.client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function StudioLayout({ children }: { children: ReactNode }) {
  const workspaces = getAvailableWorkspaces().map(({ id, label, route }) => ({ id, label, route }));

  return (
    <section className="min-w-0 bg-slate-50 md:flex" aria-label="Dev Studio">
      <StudioNavigation workspaces={workspaces} />
      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </section>
  );
}
