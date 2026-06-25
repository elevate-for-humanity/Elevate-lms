/**
 * Tenant Isolation Middleware
 * Extracts and validates tenant context from JWT
 * Rejects requests without valid tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
  licenseStatus: 'active' | 'suspended' | 'expired' | 'cancelled';
}

/**
 * Extract tenant context from authenticated request
 */
export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Get profile with tenant info
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.tenant_id) {
      return null;
    }

    // Get tenant license status
    const { data: tenant } = await supabase
      .from('tenants')
      .select('license_status')
      .eq('id', profile.tenant_id)
      .maybeSingle();

    return {
      tenantId: profile.tenant_id,
      userId: user.id,
      role: profile.role,
      licenseStatus: tenant?.license_status || 'active',
    };
  } catch (error) {
    logger.error('Failed to get tenant context', error as Error);
    return null;
  }
}

/**
 * Middleware wrapper for tenant-scoped routes
 * Use in API routes that require tenant isolation
 */
export async function withTenant<T>(
  request: NextRequest,
  handler: (ctx: TenantContext) => Promise<T>,
): Promise<Response | T> {
  const ctx = await getTenantContext(request);

  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized - no tenant context' }, { status: 401 });
  }

  // Check license status
  if (ctx.licenseStatus === 'suspended') {
    return NextResponse.json(
      { error: 'License suspended - please contact support' },
      { status: 403 },
    );
  }

  if (ctx.licenseStatus === 'expired') {
    return NextResponse.json({ error: 'License expired - please renew' }, { status: 403 });
  }

  if (ctx.licenseStatus === 'cancelled') {
    return NextResponse.json({ error: 'License cancelled' }, { status: 403 });
  }

  return handler(ctx);
}

/**
 * Validate that user has access to a specific tenant
 */
export async function validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) return false;

  // Super admins can access any tenant
  if (profile.role === 'admin') return true;

  // Regular users can only access their own tenant
  return profile.tenant_id === tenantId;
}

/**
 * Check if license has specific feature enabled
 */
export async function hasLicenseFeature(tenantId: string, feature: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: license } = await supabase
    .from('licenses')
    .select('features, status')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  if (!license) return false;

  const features = license.features as Record<string, boolean> | null;
  return features?.[feature] === true;
}

/**
 * Get all features for a tenant's license
 */
export async function getLicenseFeatures(tenantId: string): Promise<Record<string, boolean>> {
  const supabase = await createClient();

  const { data: license } = await supabase
    .from('licenses')
    .select('features')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle();

  return (license?.features as Record<string, boolean>) || {};
}
