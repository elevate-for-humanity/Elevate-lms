import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/workflows/runs — recent runs across all workflows
export async function GET(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200);
  const workflowId = url.searchParams.get('workflow_id');

  let q = db
    .from('workflow_runs')
    .select('*, workflow:workflows(name, category)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (workflowId) q = q.eq('workflow_id', workflowId) as typeof q;

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data ?? [] });
}
