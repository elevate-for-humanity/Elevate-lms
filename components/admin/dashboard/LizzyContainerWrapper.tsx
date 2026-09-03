'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { RecentApplication, SitePreviewTarget } from './types';

const LizzyContainer = dynamic(
  () => import('./LizzyContainer').then((m) => m.LizzyContainer),
  {
    ssr: false,
    loading: () => (
      <div className="mb-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Loading Lizzy…
      </div>
    ),
  },
);

function LizzyContainerInner({
  sites,
  defaultPreviewUrl,
  isSuperAdmin,
  pendingApplications,
  pendingApplicationsCount,
  pendingProgramHolders,
}: {
  sites: SitePreviewTarget[];
  defaultPreviewUrl?: string;
  isSuperAdmin: boolean;
  pendingApplications?: RecentApplication[];
  pendingApplicationsCount?: number;
  pendingProgramHolders?: number;
}) {
  const targets = (Array.isArray(sites) ? sites : [])
    .filter((s): s is SitePreviewTarget => s != null && typeof s === 'object' && typeof s.url === 'string')
    .map((s) => ({
      label: typeof s.label === 'string' && s.label.trim() ? s.label : s.url,
      url: s.url,
    }));

  return (
    <div className="mb-8">
      <LizzyContainer
        sites={targets}
        defaultPreviewUrl={defaultPreviewUrl}
        isSuperAdmin={isSuperAdmin}
        pendingApplications={pendingApplications ?? []}
        pendingApplicationsCount={pendingApplicationsCount ?? 0}
        pendingProgramHolders={pendingProgramHolders ?? 0}
      />
    </div>
  );
}

export default function LizzyContainerWrapper({
  sites,
  defaultPreviewUrl,
  isSuperAdmin = false,
  pendingApplications = [],
  pendingApplicationsCount = 0,
  pendingProgramHolders = 0,
}: {
  sites: SitePreviewTarget[];
  defaultPreviewUrl?: string;
  isSuperAdmin?: boolean;
  pendingApplications?: RecentApplication[];
  pendingApplicationsCount?: number;
  pendingProgramHolders?: number;
}) {
  return (
    <Suspense
      fallback={
        <div className="mb-8 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
          Loading Lizzy…
        </div>
      }
    >
      <LizzyContainerInner
        sites={sites}
        defaultPreviewUrl={defaultPreviewUrl}
        isSuperAdmin={isSuperAdmin}
        pendingApplications={pendingApplications}
        pendingApplicationsCount={pendingApplicationsCount}
        pendingProgramHolders={pendingProgramHolders}
      />
    </Suspense>
  );
}
