'use client';

/**
 * Below-the-fold dashboard panels — lazy-loaded to improve initial dashboard paint.
 */

import dynamic from 'next/dynamic';

const panelSkeleton = (
  <div className="rounded-xl border border-slate-200 bg-white p-6 mb-6 animate-pulse">
    <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
    <div className="h-24 w-full bg-slate-100 rounded" />
  </div>
);

export const PublishWebsitePanelLazy = dynamic(
  () => import('./PublishWebsitePanel').then((m) => m.PublishWebsitePanel),
  { loading: () => panelSkeleton, ssr: false },
);

export const ProgramIntegrityPanelLazy = dynamic(
  () => import('./ProgramIntegrityPanel').then((m) => m.ProgramIntegrityPanel),
  { loading: () => panelSkeleton, ssr: false },
);

export const JobBoardPanelLazy = dynamic(
  () => import('./JobBoardPanel').then((m) => m.JobBoardPanel),
  { loading: () => panelSkeleton, ssr: false },
);

export const SitePreviewPanelWrapperLazy = dynamic(
  () => import('./SitePreviewPanelWrapper'),
  { loading: () => panelSkeleton, ssr: false },
);

export const LizzyContainerWrapperLazy = dynamic(() => import('./LizzyContainerWrapper'), {
  loading: () => panelSkeleton,
  ssr: false,
});
