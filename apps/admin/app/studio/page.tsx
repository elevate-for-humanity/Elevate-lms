// Admin-owned AI operating surface. Studio capabilities are tools behind one conversation-first interface.
import Link from 'next/link';
import { ArrowLeft, Bot, ShieldCheck, Wrench } from 'lucide-react';

import StudioWorkspaceGrid from './StudioWorkspaceGrid.client';
import UnifiedEllieChat from '@/components/studio/UnifiedEllieChat';
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
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Admin Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin + MFA governed
            </span>
            <Link
              href="/system-health"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
            >
              Platform health
            </Link>
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <Bot className="h-6 w-6 text-gray-900" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admin AI</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                  Tell the platform what you need done
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Course Builder, website publishing, deployments, documents, workflows, reporting, code inspection, and operational actions run as internal tools. You should not have to choose a builder before you ask for the outcome.
                </p>
              </div>
            </div>
          </div>

          <div className="h-[68vh] min-h-[620px] max-h-[900px]">
            <UnifiedEllieChat embedded />
          </div>
        </section>

        <details className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-gray-800 marker:hidden">
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Advanced capability surfaces
            <span className="ml-1 text-xs font-normal text-gray-500">for direct inspection and troubleshooting</span>
          </summary>
          <div className="border-t border-gray-100 p-5">
            <p className="mb-5 max-w-3xl text-sm leading-6 text-gray-600">
              These routes remain available as underlying tools and audit surfaces. They are not the primary operating model; normal work should start in Admin AI above.
            </p>
            <StudioWorkspaceGrid workspaces={workspaces} />
          </div>
        </details>
      </div>
    </main>
  );
}
