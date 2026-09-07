// Admin-owned AI operating surface. Studio capabilities run through one stateful, conversation-first tool orchestrator.
import Link from 'next/link';
import {
  BookOpen,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

import StudioWorkspaceGrid from './StudioWorkspaceGrid.client';
import StudioCommandWorkspace from '@/components/studio/StudioCommandWorkspace';
import { requireRole } from '@/lib/auth/require-role';
import { getAvailableWorkspaces } from '@/lib/devstudio/workspace-registry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function StudioPage() {
  await requireRole(['super_admin', 'admin']);

  const workspaces = getAvailableWorkspaces().map(
    ({ id, label, description, route, healthEndpoint }) => ({
      id,
      label,
      description,
      route,
      healthEndpoint,
    }),
  );

  return (
    <main className="h-[calc(100dvh-73px)] w-full min-w-0 overflow-hidden bg-white text-gray-950">
      <div className="flex h-full w-full min-w-0 flex-col">
        <div className="flex min-h-14 min-w-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 sm:px-6">
          <div><h1 className="text-base font-black text-gray-950 sm:text-lg">Elevate Admin AI</h1><p className="hidden text-xs font-medium text-gray-500 sm:block">Live tools, approvals, records, code, and deployment evidence</p></div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            <Link
              href="/studio/courses"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-800 sm:px-4 sm:text-sm"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Courses
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Protected admin tools
            </span>
            <Link
              href="/system-health"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              Platform health
            </Link>
          </div>
        </div>

        <section className="min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
          <div
            id="admin-ai-workspace"
            className="h-full min-h-0 min-w-0"
          >
            <StudioCommandWorkspace
              workspaces={workspaces.map(({ id, label, route }) => ({ id, label, route }))}
            />
          </div>
        </section>

        <details className="absolute bottom-3 right-3 z-30 max-w-[calc(100%-1.5rem)] rounded-xl border border-gray-200 bg-white shadow-xl sm:bottom-6 sm:right-6 sm:max-w-lg sm:rounded-2xl">
          <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-800 marker:hidden sm:px-5 sm:py-4 sm:text-sm">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            <span className="sm:hidden">Advanced tools</span>
            <span className="hidden sm:inline">Advanced capability surfaces</span>
            <span className="hidden min-w-0 text-xs font-normal text-gray-500 sm:ml-1 sm:inline">
              for direct inspection and troubleshooting
            </span>
          </summary>
          <div className="border-t border-gray-100 p-5">
            <p className="mb-5 max-w-3xl text-sm leading-6 text-gray-600">
              These routes remain available as underlying tools and audit surfaces. They are not the
              primary operating model; normal work should start in Admin AI above.
            </p>
            <StudioWorkspaceGrid workspaces={workspaces} />
          </div>
        </details>
      </div>
    </main>
  );
}
