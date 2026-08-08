import Link from 'next/link';
import { ArrowLeft, Bot } from 'lucide-react';

import StudioWorkspaceGrid from './StudioWorkspaceGrid.client';
import { getAvailableWorkspaces } from '@/lib/devstudio/workspace-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function StudioPage() {
  const workspaces = getAvailableWorkspaces().map(({ id, label, description, route, healthEndpoint }) => ({
    id,
    label,
    description,
    route,
    healthEndpoint,
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Admin Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dev Studio</h1>
                <p className="mt-1 text-sm text-slate-400">One Admin-owned workspace registry. No legacy route layer.</p>
              </div>
            </div>
          </div>
          <Link
            href="/system-health"
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Platform Health
          </Link>
        </div>

        <StudioWorkspaceGrid workspaces={workspaces} />
      </div>
    </main>
  );
}
