// GET /api/provider/programs/list
// Returns provider_program_approvals for the caller's tenant (provider_admin)
// or all approvals (admin/super_admin/staff).
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiAuthGuard } from '@/lib/authGuards';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({
    requireAuth: true,
    allowedRoles: ['provider_admin', 'admin', 'super_admin', 'staff'],
  });
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') ?? '25'));
  const offset = (page - 1) * perPage;

  let query = db
    .from('provider_program_approvals')
    .select(`
      id, status, submitted_at, reviewed_at, review_notes, tenant_id,
      program:programs(id, title, slug),
      submitter:profiles!submitted_by(id, full_name, email),
      reviewer:profiles!reviewed_by(id, full_name)
    `, { count: 'exact' })
    .order('submitted_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  // provider_admin scoped to their tenant
  if (auth.role === 'provider_admin') {
    query = query.eq('tenant_id', auth.profile?.tenant_id);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }

  return NextResponse.json({ approvals: data ?? [], total: count ?? 0, page, per_page: perPage });
}
