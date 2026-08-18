'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColoredLivePreviewFrame, type PreviewTarget } from './ColoredLivePreviewFrame';
import { LizzyWorkspace } from './LizzyWorkspace';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { mergePreviewTargets } from '@/lib/admin/merge-preview-targets';

const DEFAULT_TARGETS: PreviewTarget[] = [
  { label: 'Public site', url: process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl },
  {
    label: 'Admin',
    url: process.env.NEXT_PUBLIC_ADMIN_URL ?? `https://admin.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
  {
    label: 'LMS',
    url: process.env.NEXT_PUBLIC_LMS_URL ?? `https://lms.${PLATFORM_DEFAULTS.canonicalDomain}`,
  },
];

type DevStudioConfigPreview = {
  defaultPreviewUrl?: string;
  previewTargets?: PreviewTarget[];
};

export type LizzyContainerProps = {
  sites?: PreviewTarget[];
  defaultPreviewUrl?: string;
  className?: string;
  previewMinHeight?: number;
  isSuperAdmin?: boolean;
  pendingApplications?: import("./types").RecentApplication[];
  pendingApplicationsCount?: number;
  pendingProgramHolders?: number;
};

/**
 * Single admin command container: Lizzy workspace tools on top, live site preview below.
 * Preview targets come from Lizzy config (pages, local URLs) merged with dashboard seeds.
 */
export function LizzyContainer({
  sites,
  defaultPreviewUrl,
  className = '',
  previewMinHeight = 380,
  isSuperAdmin = false,
  pendingApplications = [],
  pendingApplicationsCount = 0,
  pendingProgramHolders = 0,
}: LizzyContainerProps) {
  const [configPreview, setConfigPreview] = useState<DevStudioConfigPreview | null>(null);

  useEffect(() => {
    fetch('/api/admin/dev-studio/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DevStudioConfigPreview | null) => {
        if (data && (data.previewTargets?.length || data.defaultPreviewUrl)) {
          setConfigPreview(data);
        }
      })
      .catch(() => setConfigPreview(null));
  }, []);

  const dashboardTargets = useMemo(() => {
    return (sites?.length ? sites : DEFAULT_TARGETS).map((t) => ({
      label: t.label,
      url: t.url,
    }));
  }, [sites]);

  const targets = useMemo(
    () => mergePreviewTargets(dashboardTargets, configPreview?.previewTargets),
    [dashboardTargets, configPreview?.previewTargets],
  );

  const [previewFromOps, setPreviewFromShell] = useState<string | undefined>();

  const resolvedDefaultUrl =
    defaultPreviewUrl ??
    configPreview?.defaultPreviewUrl ??
    (process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_SITE_URL ?? targets[0]?.url
      : targets.find((t) => /homepage|public|website|local website/i.test(t.label))?.url ?? targets[0]?.url);

  return (
    <ColoredLivePreviewFrame
      targets={targets}
      defaultUrl={resolvedDefaultUrl}
      minHeight={previewMinHeight}
      className={className}
      workspaceTop={
        <LizzyWorkspace
          isSuperAdmin={isSuperAdmin}
          onPreviewUrlDetected={(url) => setPreviewFromShell(url)}
          pendingApplications={pendingApplications}
          pendingApplicationsCount={pendingApplicationsCount}
          pendingProgramHolders={pendingProgramHolders}
        />
      }
      workspaceMinHeight={440}
      showSiteHealth
    />
  );
}

// Default export for next/dynamic
export default LizzyContainer;
