'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Clapperboard, ExternalLink } from 'lucide-react';

const VideoGeneratorClient = dynamic(
  () => import('@/app/admin/video-generator/VideoGeneratorClient').then((m) => m.default || m),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading video studio…</div>
    ),
  },
);

/** Course / lesson video generation — same stack as admin video-generator. */
export function LizzyVideoPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 px-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Clapperboard className="h-4 w-4 text-brand-red-600" />
          Video tools
        </div>
        <Link
          href="/admin/video-generator"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:underline"
        >
          Open full page <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <VideoGeneratorClient />
      </div>
    </div>
  );
}

// Default export for next/dynamic
export default LizzyVideoPanel;
