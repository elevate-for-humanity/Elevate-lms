import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const limit = Math.max(10, Math.min(Number(new URL(request.url).searchParams.get('limit') || '50'), 200));

    const { data, error } = await db
      .from('audit_logs')
      .select('id, user_id, action, resource_id, metadata, created_at')
      .ilike('action', 'grants.sam.%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      events: data ?? [],
      count: (data ?? []).length,
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load SAM timeline');
  }
}