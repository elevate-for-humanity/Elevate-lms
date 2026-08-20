// Admin-owned Dev Studio entry point. Keep this file in the Admin build so shared Dev Studio fixes trigger an Admin redeploy.
import Link from 'next/link';
import { ArrowLeft, Bot, ShieldCheck } from 'lucide-react';

import StudioWorkspaceGrid from './StudioWorkspaceGrid.client';
import { requireRole } from '@/lib/auth/require-role';
import { getAvailableWorkspaces } from '@/lib/devstudio/workspace-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function StudioPage() {
  await requireRole(['super_admin', 'admin']);

  const workspaces = getAvailableWorkspaces().map(({ id, label, description, route, healthEndpoint }) => ({
    id,
    label,
    description,
    route,
    healthEndpoint,
  }));

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Admin Dashboard
              </Link>
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                  <Bot className="h-6 w-6 text-gray-800" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">Studio</h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                    Build, operate, evaluate, and verify platform capabilities from one Admin-owned workspace.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Admin governed
              </span>
              <Link
                href="/system-health"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
              >
                Platform health
              </Link>
            </div>
          </div>
        </div>

        <StudioWorkspaceGrid workspaces={workspaces} />
      </div>
    </main>
  );
}
