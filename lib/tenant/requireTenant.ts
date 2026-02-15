import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface TenantHeaders {
  tenantId: string;
  userId: string;
  userRole: string;
}

/**
 * PATCH 4.4: Reject requests that attempt to pass tenant_id from client
 * Tenant context must ONLY come from server-derived JWT claims
 */
export function rejectClientTenantId(
  body: Record<string, unknown> | null,
  query: URLSearchParams | null
): void {
  const hasTenantInBody = body && 'tenant_id' in body;
  const hasTenantInQuery = query?.has('tenant_id');
  
  if (hasTenantInBody || hasTenantInQuery) {
    logger.warn('Client attempted to pass tenant_id', {
      inBody: hasTenantInBody,
      inQuery: hasTenantInQuery,
    });
    throw new TenantSpoofingError('tenant_id cannot be passed by client');
  }
}

export class TenantSpoofingError extends Error {
  public statusCode: number = 400;
  
  constructor(message: string) {
    super(message);
    this.name = 'TenantSpoofingError';
  }
}

/**
 * STEP 4B: Extract tenant context from request headers
 * 
 * Tenant-scoped route handlers MUST use this to get tenant_id.
 * Never accept tenant_id from query params or request body.
 */
export function requireTenant(request: NextRequest): TenantHeaders {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!tenantId) {
    logger.warn('Tenant header missing in request', {
      path: request.nextUrl.pathname,
    });
    throw new TenantRequiredError('Tenant context required');
  }

  if (!userId) {
    throw new TenantRequiredError('User context required');
  }

  return {
    tenantId,
    userId,
    userRole: userRole || 'user',
  };
}

/**
 * Get tenant headers without throwing (returns null if missing)
 */
export function getTenantHeaders(request: NextRequest): TenantHeaders | null {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  if (!tenantId || !userId) {
    return null;
  }

  return {
    tenantId,
    userId,
    userRole: userRole || 'user',
  };
}

export class TenantRequiredError extends Error {
  public statusCode: number = 403;
  
  constructor(message: string) {
    super(message);
    this.name = 'TenantRequiredError';
  }
}

/**
 * Create a JSON response for tenant errors
 */
export function tenantErrorResponse(error: TenantRequiredError | TenantSpoofingError): NextResponse {
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: error.statusCode }
  );
}
