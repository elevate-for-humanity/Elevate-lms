'use client';

import Link from 'next/link';
import { Clapperboard, ExternalLink } from 'lucide-react';

/**
 * Course Builder is the single owner of course-media orchestration.
 * This workspace panel intentionally links into that canonical surface instead
 * of embedding the retired standalone video generator.
 */
export function LizzyVideoPanel() {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Clapperboard className="h-4 w-4 text-brand-red-600" />
          Course media
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-bold text-slate-950">Generate lesson media in Course Builder</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Course Builder owns instructor assignment, lesson video queues, microclips, and media status for the canonical course graph.
          </p>
          <Link
            href="/course-builder"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-brand-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-blue-700"
          >
            Open Course Builder <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LizzyVideoPanel;
