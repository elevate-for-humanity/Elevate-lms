import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

export class TenantContextError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'TenantContextError';
    this.statusCode = statusCode;
  }
}

/**
 * STEP 4A: Single source of truth for tenant context
 *
 * Extracts tenant_id from:
 * 1. JWT claims (preferred) - auth.jwt() ->> 'tenant_id'
 * 2. User metadata fallback - user.user_metadata.tenant_id
 *
 * Throws TenantContextError if tenant_id is missing for tenant-scoped routes
 */
export async function getTenantContext(): Promise<TenantContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new TenantContextError('Authentication required', 401);
  }

  // Try JWT claims first (preferred)
  // Note: In Supabase, custom claims can be added via auth hooks
  // For now, we use user_metadata as the source
  const tenantId = user.user_metadata?.tenant_id;
  const role = user.user_metadata?.role || 'user';

  if (!tenantId) {
    logger.warn('Tenant context missing', { userId: user.id });
    throw new TenantContextError(
      'Tenant context required. User not associated with a tenant.',
      403,
    );
  }

  return {
    tenantId,
    userId: user.id,
    role,
  };
}

/**
 * Get tenant context without throwing (returns null if not available)
 */
export async function getTenantContextSafe(): Promise<TenantContext | null> {
  try {
    return await getTenantContext();
  } catch {
    return null;
  }
}

/**
 * Validate that a user belongs to a specific tenant
 */
export async function validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return false;
  }

  return user.user_metadata?.tenant_id === tenantId;
}

/**
 * PATCH 4.3: Log super-admin cross-tenant access
 * Call this when a admin accesses data outside their tenant
 */
export async function logAdminAccess(
  targetTenantId: string | null,
  action: string,
  tableAccessed: string,
  reason?: string,
): Promise<void> {
  const supabase = await createClient();

  await supabase.rpc('log_admin_access', {
    p_target_tenant_id: targetTenantId,
    p_action: action,
    p_table_accessed: tableAccessed,
    p_reason: reason || null,
  });
}
