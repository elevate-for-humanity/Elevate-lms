'use client';

import { ColoredLivePreviewFrame } from './ColoredLivePreviewFrame';
import type { SitePreviewTarget } from './types';

/** Admin dashboard column — live iframe previews + optional site health strip. */
export default function SitePreviewPanelWrapper({ sites }: { sites: SitePreviewTarget[] }) {
  const targets = sites.map((s) => ({
    label: s.label || s.url,
    url: s.url,
  }));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Live sites</h2>
        <p className="text-xs text-slate-500">Quick preview of production URLs</p>
      </div>
      <ColoredLivePreviewFrame
        targets={targets}
        className="rounded-none border-0"
        minHeight={280}
        workspaceMinHeight={300}
        showSiteHealth
      />
    </div>
  );
}
