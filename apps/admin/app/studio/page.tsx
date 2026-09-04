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
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-gray-50 text-gray-950">
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl px-3 py-3 sm:px-4 sm:py-5 lg:px-6">
        <div className="mb-3 flex min-w-0 flex-wrap items-center justify-end gap-2 sm:mb-5">
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

        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6"><div className="min-w-0 flex-1"><h1 className="text-lg font-black text-gray-950">Elevate Admin AI</h1><p className="text-xs font-medium text-gray-600">One conversation connected to live tools, approvals, and the page being inspected.</p></div><Link href="/studio/courses" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-bold text-white"><BookOpen className="h-4 w-4" />Course Builder</Link></div>
          <div
            id="admin-ai-workspace"
            className="h-[calc(100dvh-5rem)] min-h-[640px] min-w-0 scroll-mt-3 sm:h-[calc(100dvh-8rem)] sm:min-h-[620px]"
          >
            <StudioCommandWorkspace
              workspaces={workspaces.map(({ id, label, route }) => ({ id, label, route }))}
            />
          </div>
        </section>

        <details className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <summary className="flex min-w-0 cursor-pointer list-none flex-wrap items-center gap-2 px-4 py-4 text-sm font-semibold text-gray-800 marker:hidden sm:px-5">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Advanced capability surfaces
            <span className="min-w-0 text-xs font-normal text-gray-500 sm:ml-1">
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
