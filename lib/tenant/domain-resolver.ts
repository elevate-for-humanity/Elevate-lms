import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface TenantFromDomain {
  organizationId: string;
  organizationName: string;
  licenseStatus: string | null;
}

/**
 * Resolve tenant from custom domain
 * Used by middleware to route requests to correct tenant context
 */
export async function resolveTenantFromDomain(domain: string): Promise<TenantFromDomain | null> {
  // Skip resolution for main domains
  const mainDomains = [
    PLATFORM_DEFAULTS.canonicalDomain,
    PLATFORM_DEFAULTS.canonicalDomain,
    
    'localhost',
  ];

  if (mainDomains.some((d) => domain.includes(d))) {
    return null;
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_tenant_by_domain', { p_domain: domain })
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as { organization_id: string; organization_name: string; license_status: string | null };
    return {
      organizationId: row.organization_id,
      organizationName: row.organization_name,
      licenseStatus: row.license_status,
    };
  } catch {
    return null;
  }
}

/**
 * Check if tenant license allows access
 */
export function isTenantLicenseActive(status: string | null): boolean {
  return status === 'active' || status === 'trial';
}

/**
 * Get suspension page URL for locked out tenants
 */
export function getSuspensionPageUrl(organizationId: string): string {
  return `/license-suspended?org=${organizationId}`;
}
