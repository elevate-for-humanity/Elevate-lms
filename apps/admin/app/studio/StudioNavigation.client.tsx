'use client';

import Link from 'next/link';
import { Bot, ChevronLeft, Sparkles } from 'lucide-react';

export default function StudioNavigation() {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-screen-2xl px-3 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cyan-100 p-2 text-cyan-800">
              <Bot className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-black text-slate-950">Admin AI Studio</p>
              <p className="flex items-center gap-1 text-xs font-medium text-slate-600">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                One orchestrator · all platform capabilities
              </p>
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
      </div>
    </div>
  );
}
