import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import { logAuthFailure, logAdminAction } from '@/lib/monitoring';

/**
 * Get client IP from request headers
 */
function getClientIP(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Create Supabase client from request Authorization header
 * Uses anon key + JWT to identify the user
 */
function createAuthSupabaseFromRequest(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Supabase env not configured');
  }

  const authHeader = req.headers.get('authorization') || '';

  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

export interface OrgAdminResult {
  userId: string;
  role: 'org_admin' | 'super_admin';
}

/**
 * Require that the request is from an org_admin or super_admin
 *
 * @param req - Request object
 * @param orgId - Organization ID to check membership
 * @returns User ID and role if authorized
 * @throws Error if unauthorized or forbidden
 *
 * @example
 * ```ts
 * export async function GET(req: Request) {
 *   try {
 *     const { userId, role } = await requireOrgAdmin(req, organizationId);
 *     // User is authorized, continue...
 *   } catch (err) {
 *     return NextResponse.json(
 *       { error: 'Authorization failed' },
 *       { status: err.message === 'Unauthorized' ? 401 : 403 }
 *     );
 *   }
 * }
 * ```
 */
export async function requireOrgAdmin(
  req: Request,
  orgId: string
): Promise<OrgAdminResult> {
  const endpoint = new URL(req.url).pathname;
  const ip = getClientIP(req);

  // Get user from JWT
  const supabaseAuth = createAuthSupabaseFromRequest(req);
  const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser();

  if (userErr || !userRes?.user) {
    logAuthFailure(endpoint, 401, ip, undefined, 'Missing or invalid JWT');
    throw new Error('Unauthorized');
  }

  // Check if user is org_admin or super_admin for this organization
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('organization_users')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userRes.user.id)
    .maybeSingle();

  if (error) {
    logAuthFailure(endpoint, 403, ip, userRes.user.id, 'Database error checking role');
    throw new Error('Forbidden');
  }

  if (!data) {
    logAuthFailure(endpoint, 403, ip, userRes.user.id, 'User not in organization');
    throw new Error('Forbidden');
  }

  if (!['org_admin', 'super_admin'].includes(data.role)) {
    logAuthFailure(endpoint, 403, ip, userRes.user.id, `Insufficient role: ${data.role}`);
    throw new Error('Forbidden');
  }

  // Log successful admin access
  logAdminAction(endpoint, userRes.user.id, 'Admin access granted', {
    role: data.role,
    orgId,
  });

  return {
    userId: userRes.user.id,
    role: data.role as 'org_admin' | 'super_admin',
  };
}

/**
 * Require super_admin role specifically
 */
export async function requireSuperAdmin(
  req: Request,
  orgId: string
): Promise<OrgAdminResult> {
  const result = await requireOrgAdmin(req, orgId);

  if (result.role !== 'super_admin') {
    throw new Error('Forbidden');
  }

  return result;
}
