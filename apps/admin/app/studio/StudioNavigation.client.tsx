'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ChevronLeft, Menu, X } from 'lucide-react';
import { useState } from 'react';

type Workspace = { id: string; label: string; route: string };

export default function StudioNavigation({ workspaces }: { workspaces: Workspace[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // The command workspace owns the richer agent/tool rail on the Studio home.
  if (pathname === '/studio') return null;

  return (
    <div className="border-b border-slate-200 bg-white md:border-b-0 md:border-r">
      <div className="px-4 py-4 sm:px-6 md:sticky md:top-0 md:h-screen md:w-64 md:overflow-y-auto">
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
          <button type="button" onClick={() => setOpen((value) => !value)} className="rounded-lg border border-slate-300 p-2 md:hidden" aria-label="Toggle Studio tools">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
        <nav className={`${open ? 'flex' : 'hidden'} mt-4 flex-col gap-1 md:flex`} aria-label="Studio workspaces">
          <Link
            href="/studio"
            onClick={() => setOpen(false)}
            className={`rounded-lg px-3 py-2 text-sm font-bold ${
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
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-bold ${
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
