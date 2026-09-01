// Admin-owned AI operating surface. Studio capabilities are tools behind one conversation-first interface.
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Mic,
  ShieldCheck,
  Sparkles,
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
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto min-w-0 max-w-screen-2xl px-2 py-3 sm:px-4 sm:py-5 lg:px-6">
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
          <div className="relative isolate overflow-hidden border-b border-indigo-900/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-800 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_65%_120%,rgba(168,85,247,0.3),transparent_46%)]" />
            <div className="relative grid min-h-[250px] items-center gap-5 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)] lg:px-10 lg:py-9">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 backdrop-blur">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  One unified Admin AI
                </div>
                <div className="flex items-start gap-3">
                  <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur sm:flex">
                    <Bot className="h-7 w-7 text-cyan-200" aria-hidden="true" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                      Tell the platform what you need done
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
                      Build courses, inspect code, publish websites, run workflows, review
                      operations, and manage deployments from one intelligent conversation.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-blue-50 sm:text-sm">
                      {[
                        '14 connected capabilities',
                        'Automatic tool routing',
                        'Audited execution',
                      ].map((label) => (
                        <span key={label} className="inline-flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                          {label}
                        </span>
                      ))}
                    </div>
                    <a
                      href="#admin-ai-workspace"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-950 shadow-lg shadow-indigo-950/20 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-950"
                    >
                      <Mic className="h-4 w-4" aria-hidden="true" />
                      Talk to Admin AI
                      <ArrowDown className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="relative hidden min-h-[210px] lg:block">
                <Image
                  src="/studio-hero.svg"
                  alt="Unified AI command center connecting courses, websites, data, and deployments"
                  fill
                  priority
                  sizes="(min-width: 1024px) 34vw, 0px"
                  className="object-contain object-right"
                />
              </div>
            </div>
          </div>

          <div
            id="admin-ai-workspace"
            className="h-[calc(100dvh-7rem)] min-h-[540px] min-w-0 scroll-mt-3 sm:h-[calc(100dvh-8rem)] sm:min-h-[620px]"
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
