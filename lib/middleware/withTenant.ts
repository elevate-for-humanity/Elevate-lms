import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * SECTION 5: Tenant isolation middleware
 * Extracts tenant_id from JWT and injects into request context
 * Rejects requests without valid tenant context
 */
export async function withTenant(
  request: NextRequest,
  handler: (req: NextRequest, tenant: TenantContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Extract tenant_id from user metadata
    const tenantId = user.user_metadata?.tenant_id;
    const role = user.user_metadata?.role || 'user';

    if (!tenantId) {
      logger.warn('Request without tenant context', { userId: user.id });
      return NextResponse.json({ error: 'Tenant context required' }, { status: 403 });
    }

    const tenantContext: TenantContext = {
      tenantId,
      userId: user.id,
      role,
    };

    return handler(request, tenantContext);
  } catch (error) {
    logger.error('Tenant middleware error', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Validate that a user has access to a specific tenant
 */
export async function validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle();

  return profile?.tenant_id === tenantId;
}

/**
 * Get tenant ID from request (for use in API routes)
 */
export async function getTenantFromRequest(request: NextRequest): Promise<TenantContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const tenantId = user.user_metadata?.tenant_id;
    if (!tenantId) return null;

    return {
      tenantId,
      userId: user.id,
      role: user.user_metadata?.role || 'user',
    };
  } catch {
    return null;
  }
}
