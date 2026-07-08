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

// Handle both default and named exports
const withFallback = (m: any) => m.default || m;

export const PublishWebsitePanelLazy = dynamic(
  () => import('./PublishWebsitePanel').then(withFallback),
  { loading: () => panelSkeleton, ssr: false },
);

export const ProgramIntegrityPanelLazy = dynamic(
  () => import('./ProgramIntegrityPanel').then(withFallback),
  { loading: () => panelSkeleton, ssr: false },
);

export const JobBoardPanelLazy = dynamic(
  () => import('./JobBoardPanel').then(withFallback),
  { loading: () => panelSkeleton, ssr: false },
);

export const SitePreviewPanelWrapperLazy = dynamic(
  () => import('./SitePreviewPanelWrapper').then(withFallback),
  { loading: () => panelSkeleton, ssr: false },
);

export const LizzyContainerWrapperLazy = dynamic(
  () => import('./LizzyContainerWrapper').then(withFallback),
  { loading: () => panelSkeleton, ssr: false },
);
