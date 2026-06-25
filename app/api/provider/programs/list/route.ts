import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeDbError, safeError, safeInternalError } from '@/lib/api/safe-error';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LIST_ROLES = new Set(['provider_admin', 'admin', 'staff']);

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;
  if (!auth.role || !LIST_ROLES.has(auth.role)) return safeError('Forbidden', 403);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tenantIdParam = searchParams.get('tenant_id');
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get('per_page') ?? 25)));
    const offset = (page - 1) * perPage;

    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('tenant_id')
      .eq('id', auth.id)
      .maybeSingle();
    if (profileError) return safeDbError(profileError, 'Provider program list profile lookup failed');

    const ownTenantId = (profile as { tenant_id?: string } | null)?.tenant_id;
    const tenantId = auth.role === 'provider_admin' ? ownTenantId : tenantIdParam;
    if (auth.role === 'provider_admin' && !tenantId) return safeError('Provider tenant is not configured', 403);

    let query = db
      .from('provider_program_approvals')
      .select(
        `
        id, tenant_id, program_id, status, submitted_by, submitted_at, reviewed_by, reviewed_at, review_notes, created_at, updated_at,
        program:programs(id, title, slug, status, is_published),
        tenant:tenants(id, name, type)
      `,
        { count: 'exact' },
      )
      .order('submitted_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (tenantId) query = query.eq('tenant_id', tenantId);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) return safeDbError(error, 'Provider program list failed');

    return NextResponse.json({ approvals: data ?? [], total: count ?? 0, page, per_page: perPage });
  } catch (error) {
    return safeInternalError(error, 'Provider program list failed');
  }
}
