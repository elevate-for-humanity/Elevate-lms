import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const { data, error } = await db.from('ai_repo_index').select('id,file_path,file_type,summary,last_indexed_at,metadata').order('last_indexed_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ files: [], total: 0, status: 'unavailable' }, { status: 503 });
  return NextResponse.json({ files: data ?? [], total: data?.length ?? 0, status: 'healthy' }, { headers: { 'Cache-Control': 'no-store' } });
}
