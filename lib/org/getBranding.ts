import { OrgConfig } from './getOrgConfig';

export interface Branding {
  logo: string | null;
  primaryColor: string | null;
  siteName: string | null;
}

/**
 * Get branding configuration for this org
 * Returns null values if not configured (falls back to default branding)
 */
export function getBranding(config: OrgConfig): Branding {
  return {
    logo: config?.branding?.logo_url ?? null,
    primaryColor: config?.branding?.primary_color ?? null,
    siteName: config?.branding?.site_name ?? null,
  };
}
