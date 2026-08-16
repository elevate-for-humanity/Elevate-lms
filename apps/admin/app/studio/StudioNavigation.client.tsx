'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, ChevronLeft, Menu, X } from 'lucide-react';
import { useState } from 'react';

type Workspace = { id: string; label: string; route: string };

export default function StudioNavigation({ workspaces }: { workspaces: Workspace[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-3 top-3 z-50 rounded-lg border border-slate-700 bg-slate-900 p-2 text-white lg:hidden"
        aria-label="Open Studio navigation"
      >
        <Menu className="h-5 w-5" />
      </button>
      {open && <button className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-label="Close Studio navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform lg:sticky lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-slate-800 p-4">
          <div className="rounded-lg bg-cyan-500/15 p-2 text-cyan-300"><Bot className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1"><p className="font-black">Dev Studio</p><p className="text-[11px] text-slate-400">Canonical Admin workspace</p></div>
          <button type="button" className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close Studio navigation"><X className="h-5 w-5" /></button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Studio workspaces">
          <Link href="/studio" onClick={() => setOpen(false)} className={`mb-1 block rounded-lg px-3 py-2 text-sm font-bold ${pathname === '/studio' ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900'}`}>Overview</Link>
          {workspaces.map((workspace) => {
            const active = pathname === workspace.route || pathname.startsWith(`${workspace.route}/`);
            return <Link key={workspace.id} href={workspace.route} onClick={() => setOpen(false)} className={`mb-1 block rounded-lg px-3 py-2 text-sm ${active ? 'bg-slate-800 font-bold text-cyan-300' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>{workspace.label}</Link>;
          })}
        </nav>
        <Link href="/dashboard" className="m-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"><ChevronLeft className="h-4 w-4" /> Admin dashboard</Link>
      </aside>
    </>
  );
}
