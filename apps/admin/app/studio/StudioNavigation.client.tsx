'use client';

import Link from 'next/link';
import { Bot, ChevronLeft, Sparkles } from 'lucide-react';

export default function StudioNavigation() {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto w-full min-w-0 max-w-screen-2xl px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-800">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 sm:text-base">Admin AI Studio</p>
              <p className="hidden items-center gap-1 truncate text-xs font-medium text-slate-600 min-[390px]:flex">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                One orchestrator / all platform capabilities
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden min-[390px]:inline">Admin dashboard</span>
            <span className="min-[390px]:hidden">Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
