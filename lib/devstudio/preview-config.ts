/**
 * Dev Studio live-preview URL resolution.
 *
 * The admin ECS task sets NEXT_PUBLIC_SITE_URL to the admin hostname; the public
 * marketing site must come from NEXT_PUBLIC_PUBLIC_SITE_URL (or LMS URL), not SITE_URL.
 */

export type PreviewTarget = { label: string; url: string };

export type DevStudioPreviewConfig = {
  publicSiteUrl: string;
  adminSiteUrl: string;
  defaultPreviewUrl: string;
  previewTargets: PreviewTarget[];
};

function trimUrl(url: string | undefined | null): string {
  return (url ?? '').trim().replace(/\/$/, '');
}

function hostnameIsAdmin(host: string): boolean {
  const h = host.toLowerCase();
  return h === 'admin.elevateforhumanity.org' || h.startsWith('admin.');
}

/** Canonical public (www / LMS) origin for marketing pages. */
export function resolvePublicSiteUrl(): string {
  const explicit = trimUrl(process.env.NEXT_PUBLIC_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const site = trimUrl(process.env.NEXT_PUBLIC_SITE_URL);
  if (site) {
    try {
      const host = new URL(site).hostname;
      if (!hostnameIsAdmin(host)) return site;
    } catch {
      /* invalid URL */
    }
  }

  const lms = trimUrl(process.env.NEXT_PUBLIC_LMS_URL);
  if (lms) {
    try {
      return new URL(lms).origin;
    } catch {
      /* invalid URL */
    }
  }

  return 'https://www.elevateforhumanity.org';
}

/** Canonical admin app origin. */
export function resolveAdminSiteUrl(): string {
  return trimUrl(process.env.NEXT_PUBLIC_ADMIN_URL) || 'https://admin.elevateforhumanity.org';
}

/** Default iframe URL when Dev Studio opens (overridable via env / platform_settings). */
export function resolveDefaultPreviewUrl(options?: {
  requestHost?: string | null;
  publicSiteUrl?: string;
  adminSiteUrl?: string;
}): string {
  const configured =
    trimUrl(process.env.DEVSTUDIO_DEFAULT_PREVIEW_URL) ||
    trimUrl(process.env.DEVSTUDIO_PREVIEW_URL);
  if (configured) return configured;

  const publicSiteUrl = options?.publicSiteUrl ?? resolvePublicSiteUrl();
  const adminSiteUrl = options?.adminSiteUrl ?? resolveAdminSiteUrl();
  const host = (options?.requestHost ?? '').split(':')[0]?.toLowerCase() ?? '';

  if (hostnameIsAdmin(host)) {
    return `${adminSiteUrl}/admin/dashboard`;
  }

  return `${publicSiteUrl}/`;
}

export function buildDevStudioPreviewTargets(options?: {
  publicSiteUrl?: string;
  adminSiteUrl?: string;
}): PreviewTarget[] {
  const publicSiteUrl = options?.publicSiteUrl ?? resolvePublicSiteUrl();
  const adminSiteUrl = options?.adminSiteUrl ?? resolveAdminSiteUrl();

  const targets: PreviewTarget[] = [];

  if (process.env.NODE_ENV === 'development') {
    const localSite = trimUrl(process.env.NEXT_PUBLIC_SITE_URL);
    if (localSite) {
      try {
        if (!hostnameIsAdmin(new URL(localSite).hostname)) {
          targets.push({ label: 'Local website', url: localSite });
        }
      } catch {
        targets.push({ label: 'Local website', url: localSite });
      }
    }
    const localAdmin = trimUrl(process.env.NEXT_PUBLIC_ADMIN_URL);
    if (localAdmin) {
      targets.push({ label: 'Local admin', url: `${localAdmin}/admin/dashboard` });
    }
  }

  targets.push(
    { label: 'Admin · Dashboard', url: `${adminSiteUrl}/admin/dashboard` },
    { label: 'Admin · Dev Studio', url: `${adminSiteUrl}/admin/dashboard` },
    { label: 'Admin · Course builder', url: `${adminSiteUrl}/admin/courses/create` },
    { label: 'Admin · Applications', url: `${adminSiteUrl}/admin/applications` },
    { label: 'Public · Homepage', url: `${publicSiteUrl}/` },
    { label: 'Public · Programs', url: `${publicSiteUrl}/programs` },
    { label: 'Public · Program catalog', url: `${publicSiteUrl}/programs/catalog` },
    { label: 'Public · CNA program', url: `${publicSiteUrl}/programs/cna` },
    { label: 'Public · Store', url: `${publicSiteUrl}/store` },
    { label: 'Public · Apply', url: `${publicSiteUrl}/apply` },
  );

  return targets;
}

export function buildDevStudioPreviewConfig(options?: {
  requestHost?: string | null;
}): DevStudioPreviewConfig {
  const publicSiteUrl = resolvePublicSiteUrl();
  const adminSiteUrl = resolveAdminSiteUrl();

  return {
    publicSiteUrl,
    adminSiteUrl,
    defaultPreviewUrl: resolveDefaultPreviewUrl({
      requestHost: options?.requestHost,
      publicSiteUrl,
      adminSiteUrl,
    }),
    previewTargets: buildDevStudioPreviewTargets({ publicSiteUrl, adminSiteUrl }),
  };
}
