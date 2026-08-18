'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ChevronLeft } from 'lucide-react';

type Workspace = { id: string; label: string; route: string };

export default function StudioNavigation({ workspaces }: { workspaces: Workspace[] }) {
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-800">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-slate-950">Dev Studio</p>
              <p className="text-xs font-medium text-slate-600">Admin workspace tools</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Admin dashboard
          </Link>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Studio workspaces">
          <Link
            href="/studio"
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
              pathname === '/studio'
                ? 'bg-cyan-700 text-white'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
            }`}
          >
            Overview
          </Link>
          {workspaces.map((workspace) => {
            const active = pathname === workspace.route || pathname.startsWith(`${workspace.route}/`);
            return (
              <Link
                key={workspace.id}
                href={workspace.route}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                }`}
              >
                {workspace.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
